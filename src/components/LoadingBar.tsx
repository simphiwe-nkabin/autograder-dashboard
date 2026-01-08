import { useEffect, useState } from "react";

/**
 * A stylized progress bar with a simulated "buffering" effect.
 */
export default function LoadingBar({ max, value }: { max: number, value: number }) {

    const [buffer, setBuffer] = useState<number>(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setBuffer(prev => prev + 0.1)
        }, 200);

        // Cleanup
        return () => clearInterval(intervalId);
    }, [])

    useEffect(() => {
        setBuffer(0)
    }, [value])

    // Calculate percentage and ensure it doesn't exceed 100%
    const progressPercentage = Math.min(((value / max) * 100) + buffer, 100);

    return (
        <progress
            className="animate-pulse w-full [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg   [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:bg-blue-500 [&::-moz-progress-bar]:bg-blue-500 h-1 [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-500"
            value={progressPercentage}
            max={100} />
    )
}
