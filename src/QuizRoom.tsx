import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export function QuizRoom({ roomId, isHost }: { roomId: string; isHost: boolean }) {
    const [roomStatus, setRoomStatus] = useState<'waiting' | 'countdown' | 'in_progress'>('waiting');
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // Subscribe to live changes on the specific room
        const channel = supabase
            .channel(`room:${roomId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'room', filter: `id=eq.${roomId}` },
                (payload) => {
                    setRoomStatus(payload.new.status);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    // Handle local 5-second countdown when status shifts to 'countdown'
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
        <div>
            {roomStatus === 'waiting' && isHost && (
                <button onClick={handleLaunchQuiz}>Launch Quiz</button>
            )}

            {roomStatus === 'countdown' && (
                <h1>Quiz starts in: {countdown}</h1>
            )}
        </div>
    );
}