import { useEffect, useState } from 'react';
import { Button, Typography, Box } from '@mui/material';
import { supabase } from './supabaseClient';

interface QuizRoomProps {
    roomId: string;
    isHost: boolean;
    onStartQuiz: () => void;
}

export function QuizRoom({ roomId, isHost, onStartQuiz }: QuizRoomProps) {
    const [roomStatus, setRoomStatus] = useState<'waiting' | 'countdown' | 'in_progress'>('waiting');
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // Subscribe to live room status changes
        const channel = supabase
            .channel(`room:${roomId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'room', filter: `id=eq.${roomId}` },
                (payload) => {
                    const newStatus = payload.new.status;
                    setRoomStatus(newStatus);
                    if (newStatus === 'countdown') {
                        onStartQuiz();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, onStartQuiz]);

    // 5-second countdown timer
    useEffect(() => {
        if (roomStatus === 'countdown') {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [roomStatus]);

    const handleLaunchQuiz = async () => {
        await supabase
            .from('room')
            .update({ status: 'countdown' })
            .eq('id', roomId);
    };

    return (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
            {roomStatus === 'waiting' && isHost && (
                <Button variant="contained" color="primary" size="large" onClick={handleLaunchQuiz}>
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