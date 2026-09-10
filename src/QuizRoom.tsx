import { useEffect, useState, useRef } from 'react';
import { Button, Typography, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { supabase } from './supabaseClient';

interface PlayerInfo {
    id: string;
    name: string;
}

interface QuizRoomProps {
    roomId: string;
    isHost: boolean;
    playerName: string;
    playerId: string;
    hostParticipates?: boolean;
    onStartQuiz: () => void;
    t: {
        joinedPlayers: string;
        launchQuiz: string;
        waitingForHost: string;
        startsIn: string;
        confirmTitle: string;
        confirmDesc: string;
        cancel: string;
        confirmStart: string;
    };
}

export function QuizRoom({ roomId, isHost, playerName, playerId, hostParticipates = true, onStartQuiz, t }: QuizRoomProps) {
    const [roomStatus, setRoomStatus] = useState<'waiting' | 'countdown' | 'in_progress' | 'finished'>('waiting');
    const [countdown, setCountdown] = useState(5);
    const [players, setPlayers] = useState<PlayerInfo[]>([]);
    const [maxPlayers, setMaxPlayers] = useState<number>(5);
    const [isHostParticipating, setIsHostParticipating] = useState<boolean>(hostParticipates);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const hasTriggeredRef = useRef(false);

    useEffect(() => {
        supabase
            .from('room')
            .select('max_players, status, host_participates')
            .eq('id', roomId)
            .single()
            .then(({ data }) => {
                if (data) {
                    if (data.max_players) setMaxPlayers(data.max_players);
                    if (data.status) setRoomStatus(data.status);
                    if (typeof data.host_participates === 'boolean') {
                        setIsHostParticipating(data.host_participates);
                    }
                }
            });

        const roomChannel = supabase
            .channel(`room_status:${roomId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'room', filter: `id=eq.${roomId}` },
                (payload) => {
                    if (payload.new) {
                        if (payload.new.status) {
                            setRoomStatus(payload.new.status);
                            if (payload.new.status === 'countdown') {
                                hasTriggeredRef.current = false;
                                setCountdown(5);
                            }
                        }
                        if (typeof payload.new.host_participates === 'boolean') {
                            setIsHostParticipating(payload.new.host_participates);
                        }
                    }
                }
            )
            .subscribe();

        const amIPlayer = !isHost || isHostParticipating;
        const presenceChannel = supabase.channel(`presence:${roomId}`);

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState() as Record<string, Array<{ id: string; user: string; isPlayer: boolean }>>;
                const joinedList: PlayerInfo[] = [];
                Object.keys(state).forEach((key) => {
                    const presences = state[key];
                    presences.forEach((p) => {
                        if (p?.id && p?.isPlayer && !joinedList.some((item) => item.id === p.id)) {
                            joinedList.push({ id: p.id, name: p.user });
                        }
                    });
                });
                setPlayers(joinedList);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({ id: playerId, user: playerName, isPlayer: amIPlayer });
                }
            });

        return () => {
            supabase.removeChannel(roomChannel);
            supabase.removeChannel(presenceChannel);
        };
    }, [roomId, playerName, playerId, isHost, isHostParticipating]);

    useEffect(() => {
        if (roomStatus === 'countdown') {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        if (!hasTriggeredRef.current) {
                            hasTriggeredRef.current = true;

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

    const handleConfirmLaunch = async () => {
        setConfirmOpen(false);
        await supabase
            .from('room')
            .update({ status: 'countdown' })
            .eq('id', roomId);
    };

    return (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t.joinedPlayers} ({players.length}/{maxPlayers}):
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {players.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Waiting for players...
                        </Typography>
                    ) : (
                        players.map((p) => (
                            <Chip key={p.id} label={p.name} color={p.id === playerId ? 'primary' : 'default'} />
                        ))
                    )}
                </Box>
            </Box>

            {roomStatus === 'waiting' && isHost && (
                <Button variant="contained" color="error" size="large" onClick={() => setConfirmOpen(true)}>
                    {t.launchQuiz}
                </Button>
            )}

            {roomStatus === 'waiting' && !isHost && (
                <Typography variant="body2" color="text.secondary">
                    {t.waitingForHost}
                </Typography>
            )}

            {roomStatus === 'countdown' && (
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', my: 2 }}>
                    {t.startsIn} {countdown}
                </Typography>
            )}

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>{t.confirmTitle}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {players.length}/{maxPlayers} {t.confirmDesc}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setConfirmOpen(false)}
                        sx={{ backgroundColor: '#E8DA4D', color: '#AC2F29', '&:hover': { backgroundColor: '#d8c93d' } }}
                    >
                        {t.cancel}
                    </Button>
                    <Button variant="contained" color="primary" onClick={handleConfirmLaunch}>
                        {t.confirmStart}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}