import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getRecordings, deleteRecording } from "../api/recording";
import { RecordingCard } from "../components/RecordingCard";

type Recording = {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  fileSize: number;
  createdAt: string;
};

export function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [playingRecording, setPlayingRecording] = useState<Recording | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: recordings, isLoading } = useQuery({
    queryKey: ["recordings"],
    queryFn: getRecordings,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecording,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordings"] });
    },
  });

  const filteredRecordings = recordings?.filter((r: Recording) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Recordings</h1>
          <button
            onClick={() => navigate("/home")}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm font-medium"
          >
            + New Meeting
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Search recordings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <p className="text-gray-400">Loading recordings...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!recordings || recordings.length === 0) && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">No recordings yet</p>
            <button
              onClick={() => navigate("/home")}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded font-medium"
            >
              Start Your First Meeting
            </button>
          </div>
        )}

        {/* Grid */}
        {!isLoading && filteredRecordings?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecordings.map((recording: Recording) => (
              <RecordingCard
                key={recording.id}
                recording={recording}
                onDelete={(id) => deleteMutation.mutate(id)}
                onPlay={(r) => setPlayingRecording(r)}
              />
            ))}
          </div>
        )}

        {/* No Search Results */}
        {!isLoading && searchQuery && filteredRecordings?.length === 0 && (
          <p className="text-center text-gray-400 py-10">No recordings match "{searchQuery}"</p>
        )}
      </div>

      {/* Video Player Modal */}
      {playingRecording && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPlayingRecording(null)}
        >
          <div
            className="bg-gray-800 rounded-lg overflow-hidden max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-black">
              <video
                src={playingRecording.videoUrl}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>
            <div className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{playingRecording.title}</h3>
                <p className="text-sm text-gray-400">
                  {new Date(playingRecording.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setPlayingRecording(null)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}