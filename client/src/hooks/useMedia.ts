import { useState, useEffect, useRef, useCallback } from 'react';

export function useMedia() {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        let localStream: MediaStream;

        const getMedia = async () => {
            try {
                localStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                setStream(localStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = localStream;
                }
            } catch (err) {
                console.error('Media error:', err);
                setError('Camera or microphone access denied. Please allow permissions.');
            } finally {
                setIsLoading(false);
            }
        };

        getMedia();

        // Cleanup: stop all tracks when component unmounts
        return () => {
            localStream?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    const toggleVideo = useCallback(() => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
            }
        }
    }, [stream]);

    const toggleAudio = useCallback(() => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
            }
        }
    }, [stream]);

    return { stream, videoRef, error, isLoading, toggleVideo, toggleAudio };
}