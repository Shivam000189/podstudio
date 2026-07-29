import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import API from "../api/axios";
import { useMedia } from "../hooks/useMedia";
import { useSocket } from "../hooks/useSocket";
import { VideoPlayer } from "../components/VideoPlayer";
import { useEffect } from "react";

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
    
    const { stream, error: mediaError, isLoading: mediaLoading } = useMedia();
    const { isConnected, usersInRoom, remoteUserJoined } = useSocket(id);

    const { data: room, isLoading, isError } = useQuery({
        queryKey: ['room', id],
        queryFn: () => fetchRoom(id!),
        enabled: !!id,
        retry: false,
    });

    // Debug log when someone joins
    useEffect(() => {
        if (remoteUserJoined) {
            console.log("🎉 Someone joined! Ready for WebRTC next step.");
        }
    }, [remoteUserJoined]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-amber-100">
                <p>Loading room...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-amber-100">
                <h1 className="text-2xl text-red-600 font-bold mb-2">Room not found</h1>
                <p className="mb-4">This room may have expired or does not exist.</p>
                <button 
                    className="border-2 bg-gray-400 px-4 py-2 rounded"
                    onClick={() => navigate('/home')}
                >
                    Go Home
                </button>
            </div>
        );
    }

    if (mediaError) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-amber-100">
                <h1 className="text-xl text-red-600 font-bold mb-2">{mediaError}</h1>
                <button 
                    className="border-2 bg-gray-400 px-4 py-2 rounded"
                    onClick={() => window.location.reload()}
                >
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
                        Users: {usersInRoom.length + 1}
                    </p>
                </div>
                <button 
                    onClick={() => navigate('/home')}
                    className="bg-red-500 px-4 py-1 rounded text-sm"
                >
                    Leave
                </button>
            </div>

            {/* Video Grid */}
            <div className="flex-1 p-4 grid grid-cols-2 gap-4">
                <VideoPlayer stream={stream} muted label="You" />
                
                <div className="bg-gray-800 rounded-lg flex items-center justify-center aspect-video">
                    {usersInRoom.length > 0 ? (
                        <p className="text-green-400">Other user connected! 🎉</p>
                    ) : (
                        <p className="text-gray-400">Waiting for someone to join...</p>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="p-4 border-t border-gray-700 flex justify-center gap-4">
                <button className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600">
                    🎤 Mute
                </button>
                <button className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600">
                    📹 Camera
                </button>
                <button 
                    onClick={() => navigate('/home')}
                    className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
                >
                    📞 Leave
                </button>
            </div>
        </div>
    );
}