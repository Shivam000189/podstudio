import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getRecordings, deleteRecording, updateRecording } from "../api/recording";
import { RecordingCard } from "../components/RecordingCard";

type Recording = {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  fileSize: number;
  createdAt: string;
};

type SortOption = "newest" | "oldest" | "duration" | "alphabetical";

export function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [playingRecording, setPlayingRecording] = useState<Recording | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

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

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => updateRecording(id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordings"] });
    },
  });

  // Filter + Sort
  const filteredAndSorted = useMemo(() => {
    if (!recordings) return [];

    let result = recordings.filter((r: Recording) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortBy) {
      case "newest":
        result.sort((a: Recording, b: Recording) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        result.sort((a: Recording, b: Recording) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "duration":
        result.sort((a: Recording, b: Recording) => b.duration - a.duration);
        break;
      case "alphabetical":
        result.sort((a: Recording, b: Recording) => 
          a.title.localeCompare(b.title)
        );
        break;
    }

    return result;
  }, [recordings, searchQuery, sortBy]);

  // Stats
  const stats = useMemo(() => {
    if (!recordings) return { count: 0, totalDuration: 0, totalSize: 0 };
    return {
      count: recordings.length,
      totalDuration: recordings.reduce((acc: number, r: Recording) => acc + r.duration, 0),
      totalSize: recordings.reduce((acc: number, r: Recording) => acc + r.fileSize, 0),
    };
  }, [recordings]);

  const formatTotalDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const formatTotalSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

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
        {/* Stats Bar */}
        {!isLoading && recordings?.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
              <p className="text-2xl font-bold text-blue-400">{stats.count}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Recordings</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
              <p className="text-2xl font-bold text-green-400">{formatTotalDuration(stats.totalDuration)}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Total Time</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
              <p className="text-2xl font-bold text-purple-400">{formatTotalSize(stats.totalSize)}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Storage Used</p>
            </div>
          </div>
        )}

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="🔍 Search recordings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="newest">📅 Newest First</option>
            <option value="oldest">📅 Oldest First</option>
            <option value="duration">⏱ Longest First</option>
            <option value="alphabetical">🔤 A-Z</option>
          </select>
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
        {!isLoading && filteredAndSorted.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSorted.map((recording: Recording) => (
              <RecordingCard
                key={recording.id}
                recording={recording}
                onDelete={(id) => deleteMutation.mutate(id)}
                onPlay={(r) => setPlayingRecording(r)}
                onRename={async (id, title) => {
                  await renameMutation.mutateAsync({ id, title });
                }}
              />
            ))}
          </div>
        )}

        {/* No Search Results */}
        {!isLoading && searchQuery && filteredAndSorted.length === 0 && (
          <p className="text-center text-gray-400 py-10">
            No recordings match "{searchQuery}"
          </p>
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