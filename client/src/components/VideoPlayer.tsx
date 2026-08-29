import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MicOff } from "lucide-react";
import "../App.css";

type VideoPlayerProps = {
    stream?: MediaStream | null;
    muted?: boolean;
    label?: string;
    isVideoEnabled?: boolean;
    isAudioEnabled?: boolean;
    isHost?: boolean;
    avatarLetter?: string;
};

export function VideoPlayer({ 
    stream, 
    muted = false, 
    label, 
    isVideoEnabled = true,
    isAudioEnabled = true,
    isHost = false,
    avatarLetter = "U"
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const showAvatar = !isVideoEnabled || !stream || stream.getVideoTracks().length === 0 || !stream.getVideoTracks()[0].enabled;

    return (
        <div className="video-shell-inner">
            <AnimatePresence mode="wait">
                {showAvatar ? (
                    <motion.div 
                        key="avatar"
                        className="video-avatar-fallback"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="avatar-circle">
                            <span>{avatarLetter}</span>
                        </div>
                        <div className="avatar-status-pill mono">
                            <span className="cam-off-dot" />
                            <span>Camera Off</span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.video
                        key="video"
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={muted}
                        className="video-element-feed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                )}
            </AnimatePresence>

            {label && (
                <div className="stream-badge-overlay">
                    <div className="badge-pill">
                        {isHost && <span className="host-tag mono">HOST</span>}
                        <span className="badge-name">{label}</span>
                        {isAudioEnabled ? (
                            <span className="audio-wave-bars" title="Audio active">
                                <span className="bar bar-1" />
                                <span className="bar bar-2" />
                                <span className="bar bar-3" />
                            </span>
                        ) : (
                            <span className="audio-muted-badge" title="Microphone muted">
                                <MicOff className="w-3 h-3 text-red-300" />
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default VideoPlayer;