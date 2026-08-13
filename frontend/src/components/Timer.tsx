import { useEffect, useState } from "react";
import { useSosData } from "../context/SocketContext";

export const Timer = () => {
    const { etaTimeLeft, submitSOS } = useSosData()
    console.log(etaTimeLeft, "etaTimeLeft")

    const [timeLeft, setTimeLeft] = useState<number>(etaTimeLeft);

    useEffect(() => {
        setTimeLeft(etaTimeLeft);
    }, [etaTimeLeft]);

    useEffect(() => {
        if (timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft]);

    // --- Total seconds ko MM:SS format mein convert karne ka function ---
    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        // Agar minutes ya seconds 10 se kam hain, toh aage '0' laga do (jaise 05:09)
        const formattedMinutes = String(minutes).padStart(2, "0");
        const formattedSeconds = String(seconds).padStart(2, "0");

        return `${formattedMinutes}:${formattedSeconds}`;
    };


    return (
        <div className="text-red-500 font-bold">
            {timeLeft > 0 ? (
                `Try again in ${formatTime(timeLeft)}`
            ) : (
                <button onClick={() => submitSOS("No description for now")} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded">
                    Re-Broadcast
                </button>
            )}
        </div>
    );
};