import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { getRecordings, deleteRecording, updateRecording } from "../api/recording";
import { RecordingCard } from "../components/RecordingCard";
import {
  FolderOpen,
  Plus,
  ArrowLeft,
  Search,
  ChevronDown,
  Clock,
  HardDrive,
  Film,
  Download,
  Trash2,
  X,
  Check
} from "lucide-react";
import "../App.css";

type Recording = {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  fileSize: number;
  createdAt: string;
};

type SortOption = "newest" | "oldest" | "duration" | "alphabetical";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
};

const AnimatedCounter = ({ end, duration = 1200 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(end * progress));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <>{count}</>;
};

export function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [playingRecording, setPlayingRecording] = useState<Recording | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [sortOpen, setSortOpen] = useState(false);

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
    <div className="dashboard-shell">
      {/* Top Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-title-group">
            <button 
              type="button"
              onClick={() => navigate("/home")} 
              className="dash-back-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Studio</span>
            </button>
            <div className="dash-title-wrap">
              <h1 className="dashboard-title">Media Library</h1>
              <span className="dash-count-pill mono">{recordings?.length || 0} Sessions</span>
            </div>
          </div>

          <button 
            onClick={() => navigate("/home")} 
            className="dash-new-session-btn"
          >
            <Plus className="w-4 h-4" />
            <span>New Session</span>
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Stats Row Strip */}
        {!isLoading && recordings && recordings.length > 0 && (
          <motion.div 
            className="stats-row"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="stat-block">
              <div className="stat-icon-wrap">
                <Film className="w-4 h-4 text-brand" />
              </div>
              <div>
                <div className="stat-value">
                  <AnimatedCounter end={stats.count} />
                </div>
                <div className="stat-label mono">Total Master Tracks</div>
              </div>
            </div>

            <div className="stat-block">
              <div className="stat-icon-wrap">
                <Clock className="w-4 h-4 text-brand" />
              </div>
              <div>
                <div className="stat-value">
                  {formatTotalDuration(stats.totalDuration)}
                </div>
                <div className="stat-label mono">Total Recorded Time</div>
              </div>
            </div>

            <div className="stat-block">
              <div className="stat-icon-wrap">
                <HardDrive className="w-4 h-4 text-brand" />
              </div>
              <div>
                <div className="stat-value">
                  {formatTotalSize(stats.totalSize)}
                </div>
                <div className="stat-label mono">Cloud Master Storage</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search & Filter Bar */}
        <motion.div 
          className="search-filter-bar"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="search-input-wrapper">
            <Search className="w-4 h-4 search-icon" />
            <input
              type="text"
              placeholder="Search recordings by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="sort-dropdown-wrapper">
            <button 
              type="button"
              className="sort-button"
              onClick={() => setSortOpen(!sortOpen)}
            >
              <span>Sort: {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : sortBy === 'duration' ? 'Duration' : 'A-Z'}</span>
              <ChevronDown className={`w-4 h-4 sort-chevron ${sortOpen ? 'rotated' : ''}`} />
            </button>

            <AnimatePresence>
              {sortOpen && (
                <motion.div 
                  className="sort-dropdown-menu"
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <button onClick={() => { setSortBy('newest'); setSortOpen(false); }} className={`sort-option ${sortBy === 'newest' ? 'selected' : ''}`}>
                    <span>Newest First</span>
                    {sortBy === 'newest' && <Check className="w-3.5 h-3.5 text-brand" />}
                  </button>
                  <button onClick={() => { setSortBy('oldest'); setSortOpen(false); }} className={`sort-option ${sortBy === 'oldest' ? 'selected' : ''}`}>
                    <span>Oldest First</span>
                    {sortBy === 'oldest' && <Check className="w-3.5 h-3.5 text-brand" />}
                  </button>
                  <button onClick={() => { setSortBy('duration'); setSortOpen(false); }} className={`sort-option ${sortBy === 'duration' ? 'selected' : ''}`}>
                    <span>Duration</span>
                    {sortBy === 'duration' && <Check className="w-3.5 h-3.5 text-brand" />}
                  </button>
                  <button onClick={() => { setSortBy('alphabetical'); setSortOpen(false); }} className={`sort-option ${sortBy === 'alphabetical' ? 'selected' : ''}`}>
                    <span>Alphabetical (A-Z)</span>
                    {sortBy === 'alphabetical' && <Check className="w-3.5 h-3.5 text-brand" />}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="empty-state-container">
            <div className="dash-loading-spinner" />
            <p className="mono" style={{ color: "var(--color-text-secondary)", marginTop: "16px" }}>
              Syncing recordings from cloud...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!recordings || recordings.length === 0) && (
          <motion.div 
            className="empty-state-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="empty-state-content">
              <div className="empty-state-icon-box">
                <FolderOpen className="w-8 h-8 text-brand" />
              </div>
              <h3>No Recordings Found</h3>
              <p className="body-text" style={{ color: "var(--color-text-secondary)", marginTop: "8px", marginBottom: "20px", maxWidth: "380px" }}>
                You haven't recorded any sessions yet. Start your first studio session to capture isolated 4K master tracks!
              </p>
              <button onClick={() => navigate("/home")} className="dash-new-session-btn">
                <Plus className="w-4 h-4" />
                <span>Launch First Session</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Grid List with Framer Motion Stagger */}
        {!isLoading && filteredAndSorted.length > 0 && (
          <motion.div 
            className="recording-grid"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {filteredAndSorted.map((recording: Recording) => (
              <motion.div key={recording.id} variants={itemVariants}>
                <RecordingCard
                  recording={recording}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onPlay={(r) => setPlayingRecording(r)}
                  onRename={async (id, title) => {
                    await renameMutation.mutateAsync({ id, title });
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* No Search Match State */}
        {!isLoading && searchQuery && filteredAndSorted.length === 0 && (
          <motion.div 
            className="empty-state-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="mono" style={{ color: "var(--color-text-secondary)" }}>
              No recordings match "{searchQuery}"
            </p>
          </motion.div>
        )}
      </div>

      {/* Cinema Video Player Modal with AnimatePresence */}
      <AnimatePresence>
        {playingRecording && (
          <motion.div
            className="video-modal-backdrop"
            onClick={() => setPlayingRecording(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="video-modal-cinema"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <button 
                type="button"
                className="modal-close-button"
                onClick={() => setPlayingRecording(null)}
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="video-container">
                <video
                  src={playingRecording.videoUrl}
                  controls
                  autoPlay
                  className="video-element"
                />
              </div>

              <div className="video-modal-info">
                <div className="modal-header-section">
                  <h2 className="modal-title-large">{playingRecording.title}</h2>
                </div>

                <div className="metadata-pills">
                  <div className="metadata-pill">
                    <span className="pill-label mono">Duration</span>
                    <span className="pill-value mono">
                      {(() => {
                        const mins = Math.floor(playingRecording.duration / 60);
                        const secs = playingRecording.duration % 60;
                        return `${mins}:${secs.toString().padStart(2, "0")}`;
                      })()}
                    </span>
                  </div>
                  <div className="metadata-pill">
                    <span className="pill-label mono">File Size</span>
                    <span className="pill-value mono">
                      {playingRecording.fileSize < 1024 * 1024
                        ? (playingRecording.fileSize / 1024).toFixed(1) + " KB"
                        : (playingRecording.fileSize / (1024 * 1024)).toFixed(1) + " MB"}
                    </span>
                  </div>
                  <div className="metadata-pill">
                    <span className="pill-label mono">Recorded</span>
                    <span className="pill-value mono">
                      {new Date(playingRecording.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                </div>

                <div className="modal-actions">
                  <a
                    href={playingRecording.videoUrl}
                    download={`${playingRecording.title}.webm`}
                    className="action-button-primary"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Master</span>
                  </a>
                  <button 
                    type="button"
                    className="action-button-danger"
                    onClick={() => {
                      if (confirm("Delete this recording from cloud library?")) {
                        deleteMutation.mutate(playingRecording.id);
                        setPlayingRecording(null);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;