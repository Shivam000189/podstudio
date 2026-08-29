import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Download, Trash2, Edit3, Check } from "lucide-react";
import "../App.css";

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
  onRename: (id: string, title: string) => Promise<void>;
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
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RecordingCard({ recording, onDelete, onPlay, onRename }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(recording.title);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this recording?")) return;
    setIsDeleting(true);
    await onDelete(recording.id);
    setIsDeleting(false);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      setEditTitle(recording.title);
      setIsEditing(false);
      return;
    }
    await onRename(recording.id, editTitle.trim());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditTitle(recording.title);
      setIsEditing(false);
    }
  };

  return (
    <motion.div 
      className="recording-card"
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
    >
      <div 
        className="recording-card-thumbnail"
        onClick={() => onPlay(recording)}
      >
        <div className="play-button-overlay">
          <Play className="w-8 h-8 fill-current text-brand" />
        </div>
        <div className="duration-badge mono">{formatDuration(recording.duration)}</div>
      </div>

      <div className="recording-card-body">
        {isEditing ? (
          <div className="edit-mode">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              autoFocus
              className="edit-input"
              maxLength={60}
            />
            <button type="button" onClick={handleSave} className="save-btn" title="Save">
              <Check className="w-3.5 h-3.5 text-brand" />
            </button>
          </div>
        ) : (
          <div className="title-row-interactive">
            <h3 
              className="recording-card-title"
              onClick={() => onPlay(recording)}
            >
              {recording.title}
            </h3>
            <button 
              type="button" 
              className="rename-trigger-btn"
              onClick={() => setIsEditing(true)}
              title="Rename title"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="recording-card-meta mono">
          <span>{formatDate(recording.createdAt)}</span>
          <span>•</span>
          <span>{formatFileSize(recording.fileSize)}</span>
        </div>

        <div className="recording-card-actions">
          <button 
            className="card-action-btn" 
            onClick={() => onPlay(recording)}
            title="Play recording"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>
          <a 
            href={recording.videoUrl} 
            download={`${recording.title}.webm`}
            className="card-action-btn"
            title="Download track"
          >
            <Download className="w-4 h-4" />
          </a>
          <button 
            className="card-action-btn delete-btn"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete from cloud"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}