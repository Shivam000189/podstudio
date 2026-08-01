import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import API from "../api/axios";
import { useMedia } from "../hooks/useMedia";
import { useSocket } from "../hooks/useSocket";
import { useWebRTC } from "../hooks/useWebRTC";
import { useRecording } from "../hooks/useRecording";
import { VideoPlayer } from "../components/VideoPlayer";
import { uploadRecording } from "../api/recording";

type RoomData = {
    roomId: string;
    createdAt: string;
    participants: number;
};

const fetchRoom = async (roomId: string): Promise<RoomData> => {
    const response = await API.get(`/rooms/${roomId}`);
    return response.data;
};

export function Rooms() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    
    const { 
        stream, 
        error: mediaError, 
        isAudioEnabled, 
        isVideoEnabled,
        toggleAudio, 
        toggleVideo,
        stopMedia 
    } = useMedia();
    
    const { isConnected, hasExistingUsers, socket, leaveRoom } = useSocket(id);
    const { remoteStream, connectionState, closeConnection } = useWebRTC(stream, id, socket, hasExistingUsers);
    
    const {
        recordingState,
        elapsedTime,
        downloadUrl,
        blob,
        startRecording,
        stopRecording,
        resetRecording
    } = useRecording(stream, remoteStream);

    const { data: room, isLoading, isError } = useQuery({
        queryKey: ['room', id],
        queryFn: () => fetchRoom(id!),
        enabled: !!id,
        retry: false,
    });

    const handleUpload = async () => {
        if (!blob) return;
        
        setIsUploading(true);
        setUploadProgress(0);
        setUploadError(null);
        
        try {
            const durationSeconds = elapsedTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
            
            await uploadRecording(
                blob,
                `Meeting ${new Date().toLocaleString()}`,
                durationSeconds,
                id,
                (percent) => setUploadProgress(percent)
            );
            
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (err: any) {
            setUploadError(err.response?.data?.message || "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const handleLeave = () => {
        if (recordingState === 'recording') stopRecording();
        stopMedia();
        closeConnection();
        leaveRoom();
        navigate('/home');
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
                <p>Loading room...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
                <h1 className="text-2xl text-red-500 font-bold mb-2">Room not found</h1>
                <button className="bg-gray-700 px-4 py-2 rounded" onClick={() => navigate('/home')}>
                    Go Home
                </button>
            </div>
        );
    }

    if (mediaError) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
                <h1 className="text-xl text-red-500 font-bold mb-2">{mediaError}</h1>
                <button className="bg-gray-700 px-4 py-2 rounded" onClick={() => window.location.reload()}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 h-screen text-white flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <div>
                    <h1 className="font-bold">Room: {room?.roomId}</h1>
                    <p className="text-xs text-gray-400">
                        {isConnected ? '🟢 Connected' : '🔴 Disconnected'} | 
                        {connectionState === 'connected' ? ' 🎥 Live' : ' ⏳ ' + connectionState}
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    {recordingState === 'recording' && (
                        <div className="flex items-center gap-2 bg-red-900/50 px-3 py-1 rounded-full border border-red-500">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            <span className="text-sm font-mono text-red-400">{elapsedTime}</span>
                        </div>
                    )}
                    <button onClick={handleLeave} className="bg-red-500 px-4 py-1 rounded text-sm hover:bg-red-600">
                        Leave
                    </button>
                </div>
            </div>

            {/* Video Grid */}
            <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <VideoPlayer stream={stream} muted label={isVideoEnabled ? "You" : "You (cam off)"} />
                {remoteStream ? (
                    <VideoPlayer stream={remoteStream} label="Remote" />
                ) : (
                    <div className="bg-gray-800 rounded-lg flex flex-col items-center justify-center aspect-video">
                        <p className="text-gray-400 mb-2">Waiting for someone to join...</p>
                        <code className="text-xs bg-gray-700 px-2 py-1 rounded break-all">{window.location.href}</code>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-4 border-t border-gray-700 flex justify-center items-center gap-4 flex-wrap">
                {/* Recording Controls */}
                {recordingState === 'idle' && (
                    <button onClick={startRecording} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded flex items-center gap-2 font-medium">
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                        Start Recording
                    </button>
                )}
                
                {recordingState === 'recording' && (
                    <button onClick={stopRecording} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded border border-red-500 text-red-400 font-medium">
                        ⏹ Stop Recording ({elapsedTime})
                    </button>
                )}
                
                {recordingState === 'stopped' && downloadUrl && (
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-green-400">✅ Recording ready</span>
                        
                        <a 
                            href={downloadUrl} 
                            download={`meeting-${new Date().toISOString().split('T')[0]}.webm`}
                            className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded font-medium"
                        >
                            ⬇ Download
                        </a>
                        
                        <button 
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 px-4 py-2 rounded font-medium"
                        >
                            {isUploading ? `☁ Uploading ${uploadProgress}%` : '☁ Save to Cloud'}
                        </button>
                        
                        <button onClick={resetRecording} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm">
                            Record Again
                        </button>
                    </div>
                )}

                {/* Upload Progress Bar */}
                {isUploading && (
                    <div className="w-full max-w-md">
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-center">{uploadProgress}% uploaded</p>
                    </div>
                )}

                {/* Success/Error Messages */}
                {uploadSuccess && <span className="text-green-400 text-sm">✅ Saved to your library!</span>}
                {uploadError && <span className="text-red-400 text-sm">❌ {uploadError}</span>}

                <div className="w-px h-8 bg-gray-600"></div>

                {/* Media Controls */}
                <button onClick={toggleAudio} className={`px-4 py-2 rounded ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'}`}>
                    {isAudioEnabled ? '🎤' : '🎤❌'}
                </button>
                <button onClick={toggleVideo} className={`px-4 py-2 rounded ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'}`}>
                    {isVideoEnabled ? '📹' : '📹❌'}
                </button>
                <button onClick={handleLeave} className="bg-red-500 px-4 py-2 rounded hover:bg-red-600">
                    📞 Leave
                </button>
            </div>
        </div>
    );
}