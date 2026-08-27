import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";

type CreateRequest = {
    createId: string;
};

type ResponseData = {
    GenerateID: string;
};

const fetchRoomId = async (data: CreateRequest): Promise<ResponseData> => {
    const response = await API.post(`/rooms/create`, data);
    return response.data;
};

export function Home() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const createMutation = useMutation({
        mutationFn: fetchRoomId,
        onSuccess: (data) => {
            navigate(`/rooms/${data.GenerateID}`);
        },
        onError: (error) => {
            console.log("Room creation failed:", error);
        },
    });

    const handleClick = () => {
        const createId = crypto.randomUUID();
        createMutation.mutate({ createId });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.reload(); // Full refresh to clear all state
    };

    return (
        <div className="flex bg-amber-100 min-h-screen">
            {/* Sidebar / User Info */}
            <div className="w-64 bg-gray-900 text-white p-6 flex flex-col justify-between">
                <div>
                    <h2 className="text-xl font-bold mb-6">PODSTUDIO</h2>
                    {user && (
                        <div className="mb-6">
                            <p className="text-sm text-gray-400">Logged in as</p>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                    )}
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="w-full text-left px-4 py-2 rounded hover:bg-gray-800 text-sm mb-2"
                    >
                        📹 My Recordings
                    </button>
                </div>
                <button 
                    onClick={handleLogout}
                    className="w-full bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-sm font-medium"
                >
                    Logout
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex">
                <div className="h-screen min-w-1/2 flex justify-center items-center">
                    <p className="text-gray-500">Video calling illustration</p>
                </div>

                <div className="justify-center items-center grid grid-rows-2 h-screen">
                    <div className="">
                        <p className="p-10 text-gray-700">
                            Welcome, <span className="font-bold">{user?.name || 'Guest'}</span>! 
                            Create a room and share the link to start a video call.
                        </p>
                        <div className="flex justify-center">
                            <button 
                                className="border-2 bg-gray-400 hover:bg-gray-500 px-6 py-3 rounded-lg font-medium disabled:opacity-50"
                                onClick={handleClick}
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? "Creating..." : "Create Room"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}