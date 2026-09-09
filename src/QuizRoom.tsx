import { useEffect, useState, useRef } from 'react';
import { Button, Typography, Box, Chip } from '@mui/material';
import { supabase } from './supabaseClient';

interface QuizRoomProps {
    roomId: string;
    isHost: boolean;
    playerName: string;
    onStartQuiz: () => void;
}

export function QuizRoom({ roomId, isHost, playerName, onStartQuiz }: QuizRoomProps) {
    const [roomStatus, setRoomStatus] = useState<'waiting' | 'countdown' | 'in_progress'>('waiting');
    const [countdown, setCountdown] = useState(5);
    const [players, setPlayers] = useState<string[]>([]);
    const hasTriggeredRef = useRef(false);

    useEffect(() => {
        // 1. Listen for room updates (status changes)
        const roomChannel = supabase
            .channel(`room_status:${roomId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'room', filter: `id=eq.${roomId}` },
                (payload) => {
                    if (payload.new && payload.new.status) {
                        setRoomStatus(payload.new.status);
                    }
                }
            )
            .subscribe();

        // 2. Track presence of players currently in lobby
        const presenceChannel = supabase.channel(`presence:${roomId}`);

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState() as Record<string, Array<{ user: string }>>;
                const joinedNames: string[] = [];
                Object.keys(state).forEach((key) => {
                    const presences = state[key];
                    presences.forEach((p) => {
                        if (p?.user && !joinedNames.includes(p.user)) {
                            joinedNames.push(p.user);
                        }
                    });
                });
                setPlayers(joinedNames);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({ user: playerName });
                }
            });

        return () => {
            supabase.removeChannel(roomChannel);
            supabase.removeChannel(presenceChannel);
        };
    }, [roomId, playerName]);

    // Handle 5-second countdown & transition into quiz
    useEffect(() => {
        if (roomStatus === 'countdown') {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        if (!hasTriggeredRef.current) {
                            hasTriggeredRef.current = true;

                            // Update database status from 'countdown' to 'in_progress'
                            if (isHost) {
                                supabase
                                    .from('room')
                                    .update({ status: 'in_progress' })
                                    .eq('id', roomId)
                                    .then();
                            }

                            onStartQuiz();
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [roomStatus, onStartQuiz, isHost, roomId]);

    const handleLaunchQuiz = async () => {
        await supabase
            .from('room')
            .update({ status: 'countdown' })
            .eq('id', roomId);
    };

    return (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Joined Players ({players.length}):
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {players.map((p, idx) => (
                        <Chip key={idx} label={p} color={p === playerName ? 'primary' : 'default'} />
                    ))}
                </Box>
            </Box>

            {roomStatus === 'waiting' && isHost && (
                <Button variant="contained" color="error" size="large" onClick={handleLaunchQuiz}>
                    Launch Quiz
                </Button>
            )}

            {roomStatus === 'waiting' && !isHost && (
                <Typography variant="body2" color="text.secondary">
                    Waiting for host to launch the quiz...
                </Typography>
            )}

            {roomStatus === 'countdown' && (
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', my: 2 }}>
                    Quiz starts in: {countdown}
                </Typography>
            )}
        </Box>
    );
}