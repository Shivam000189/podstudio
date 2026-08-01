import { useState } from "react";

type Recording = {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  fileSize: number;
  createdAt: string;
};

type Props = {
  recording: Recording;
  onDelete: (id: string) => void;
  onPlay: (recording: Recording) => void;
};

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export function RecordingCard({ recording, onDelete, onPlay }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this recording?")) return;
    setIsDeleting(true);
    await onDelete(recording.id);
    setIsDeleting(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors">
      {/* Thumbnail / Preview */}
      <div 
        className="aspect-video bg-gray-900 flex items-center justify-center cursor-pointer group relative"
        onClick={() => onPlay(recording)}
      >
        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
          <span className="text-2xl">▶</span>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-mono">
          {formatDuration(recording.duration)}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white truncate" title={recording.title}>
          {recording.title}
        </h3>
        <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
          <span>{formatDate(recording.createdAt)}</span>
          <span>{formatFileSize(recording.fileSize)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onPlay(recording)}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded text-sm font-medium"
          >
            Play
          </button>
          <a
            href={recording.videoUrl}
            download
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1.5 rounded text-sm font-medium text-center"
          >
            Download
          </a>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-900/50 hover:bg-red-900 text-red-400 px-3 py-1.5 rounded text-sm disabled:opacity-50"
          >
            {isDeleting ? "..." : "🗑"}
          </button>
        </div>
      </div>
    </div>
  );
}