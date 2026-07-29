import { useEffect, useRef } from "react";



type VideoPlayerProps = {
    stream?: MediaStream | null;
    muted?: boolean;
    label?: string;
};

export function VideoPlayer({ stream, muted = false, label }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={muted}
                className="w-full h-full object-cover"
            />
            {label && (
                <span className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
                    {label}
                </span>
            )}
        </div>
    );
}