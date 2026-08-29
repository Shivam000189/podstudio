import { useState, useTransition } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import { useMedia } from "../hooks/useMedia";
import { useSocket } from "../hooks/useSocket";
import { useWebRTC } from "../hooks/useWebRTC";
import { useRecording } from "../hooks/useRecording";
import { useAuth } from "../hooks/useAuth";
import { VideoPlayer } from "../components/VideoPlayer";
import { uploadRecording } from "../api/recording";
import "../App.css";

type RoomData = {
    roomId: string;
    createdAt: string;
    participants: number;
};

type Toast = {
    id: string;
    message: string;
    type: "info" | "success" | "error";
};

type LayoutMode = "split" | "pip" | "solo";

const fetchRoom = async (roomId: string): Promise<RoomData> => {
    const response = await API.get(`/rooms/${roomId}`);
    return response.data;
};

export function Rooms() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [, startTransition] = useTransition();
    
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [copied, setCopied] = useState(false);
    const [layoutMode, setLayoutMode] = useState<LayoutMode>("split");
    const [showSettings, setShowSettings] = useState(false);
    const [selectedResolution, setSelectedResolution] = useState("1080p");
    
    const { 
        stream, 
        error: mediaError, 
        isAudioEnabled, 
        isVideoEnabled,
        toggleAudio, 
        toggleVideo, 
        stopMedia 
    } = useMedia();
    
    const { hasExistingUsers, socket, leaveRoom } = useSocket(id);
    const { remoteStream, closeConnection } = useWebRTC(stream, id, socket, hasExistingUsers);
    
    const {
        recordingState,
        elapsedTime,
        downloadUrl,
        blob,
        startRecording,
        stopRecording,
        resetRecording
    } = useRecording(stream, remoteStream);

    const { isLoading, isError } = useQuery({
        queryKey: ['room', id],
        queryFn: () => fetchRoom(id!),
        enabled: !!id,
        retry: false,
    });

    const addToast = (message: string, type: "info" | "success" | "error" = "info") => {
        const toastId = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id: toastId, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toastId));
        }, 3500);
    };

    const handleCopyInvite = async () => {
        try {
            const url = window.location.href;
            await navigator.clipboard.writeText(url);
            setCopied(true);
            addToast("Studio invite link copied to clipboard!", "success");
            setTimeout(() => setCopied(false), 2500);
        } catch {
            addToast("Failed to copy link", "error");
        }
    };

    const handleUpload = async () => {
        if (!blob) return;
        
        setIsUploading(true);
        setUploadProgress(0);
        addToast("Uploading studio recording to cloud...", "info");
        
        try {
            const durationSeconds = elapsedTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
            
            await uploadRecording(
                blob,
                `Studio Session ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
                durationSeconds,
                id,
                (percent) => setUploadProgress(percent)
            );
            
            addToast("Recording saved successfully to your library!", "success");
        } catch (err: any) {
            const message = err.response?.data?.message || "Upload failed";
            addToast(message, "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleLeave = () => {
        if (recordingState === 'recording') stopRecording();
        stopMedia();
        closeConnection();
        leaveRoom();
        startTransition(() => {
            navigate('/home');
        });
    };

    const toggleLayout = () => {
        setLayoutMode((prev) => (prev === "split" ? "pip" : "split"));
        addToast(`Switched to ${layoutMode === "split" ? "Picture-in-Picture" : "Side-by-Side"} layout`, "info");
    };

    if (isLoading) {
        return (
            <div className="studio-shell" style={{ display: "grid", placeItems: "center" }}>
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                    <div className="spinner" style={{ width: "36px", height: "36px", borderWidth: "3px", borderColor: "rgba(64, 138, 113, 0.2)", borderTopColor: "#408a71" }} />
                    <p className="mono" style={{ color: "var(--color-text-secondary)", fontSize: "0.82rem" }}>Initializing Studio Environment...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="studio-shell" style={{ display: "grid", placeItems: "center" }}>
                <div style={{ textAlign: "center", maxWidth: "420px", padding: "32px", borderRadius: "16px", background: "var(--color-surface-card)", border: "1px solid rgba(239, 68, 68, 0.4)" }}>
                    <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", display: "grid", placeItems: "center", margin: "0 auto 16px", color: "#fca5a5" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                    </div>
                    <h2 style={{ fontFamily: "var(--font-display)", color: "#ffffff", fontSize: "1.3rem", margin: "0 0 8px" }}>Studio Room Not Found</h2>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.86rem", marginBottom: "20px" }}>
                        This studio session may have ended or the link is invalid.
                    </p>
                    <button onClick={() => navigate('/home')} className="floating-cta" style={{ width: "100%" }}>
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (mediaError) {
        return (
            <div className="studio-shell" style={{ display: "grid", placeItems: "center" }}>
                <div style={{ textAlign: "center", maxWidth: "440px", padding: "32px", borderRadius: "24px", background: "rgba(26, 25, 83, 0.7)", border: "1px solid rgba(239, 68, 68, 0.4)", backdropFilter: "blur(20px)" }}>
                    <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", display: "grid", placeItems: "center", margin: "0 auto 16px", color: "#fca5a5" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z" />
                            <path d="M19 10v2c0 3.87-3.13 7-7 7s-7-3.13-7-7v-2H3v2c0 4.63 3.5 8.44 8 8.94V23h2v-2.06c4.5-.5 8-4.31 8-8.94v-2h-2z" />
                        </svg>
                    </div>
                    <h2 style={{ fontFamily: "var(--font-display)", color: "#ffffff", fontSize: "1.4rem", margin: "0 0 8px" }}>Hardware Access Required</h2>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.88rem", marginBottom: "24px" }}>
                        {mediaError}
                    </p>
                    <button onClick={() => window.location.reload()} className="floating-cta" style={{ width: "100%" }}>
                        Grant Access & Retry
                    </button>
                </div>
            </div>
        );
    }

    const hostName = user?.name || "Host";
    const hostInitial = hostName.charAt(0).toUpperCase();

    return (
        <div className="studio-shell">
            {/* Top Studio Header Bar */}
            <motion.header 
                className="studio-header-bar"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
            >
                <div className="studio-brand-group">
                    <div className="studio-brand-badge">R</div>
                    <div className="studio-title-block">
                        <div className="studio-name">PodStudio</div>
                        <div className="studio-live-tag">
                            <span className="live-indicator-dot" />
                            <span>HD LIVE</span>
                        </div>
                    </div>
                </div>

                <div className="studio-center-meta">
                    {recordingState === 'recording' ? (
                        <div className="recording-banner-pill">
                            <span className="recording-dot-active" />
                            <span>REC {elapsedTime}</span>
                        </div>
                    ) : (
                        <button 
                            type="button" 
                            className="room-invite-pill"
                            onClick={handleCopyInvite}
                            title="Click to copy invite link"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            <span className={copied ? "copied-badge" : ""}>
                                {copied ? "Copied Link!" : `Room: ${id?.slice(0, 8)}...`}
                            </span>
                        </button>
                    )}
                </div>

                <div className="studio-header-actions">
                    <div className="quality-chip">
                        <span className="dot" />
                        <span>{selectedResolution} • 60fps</span>
                    </div>

                    {remoteStream && (
                        <button 
                            type="button" 
                            className="header-icon-btn"
                            onClick={toggleLayout}
                            title="Toggle Layout (Split / PiP)"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="12" y1="3" x2="12" y2="21" />
                            </svg>
                        </button>
                    )}

                    <button 
                        type="button" 
                        className="header-icon-btn"
                        onClick={() => setShowSettings(true)}
                        title="Studio Settings"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </button>
                </div>
            </motion.header>

            {/* Video Stage Layout */}
            <main className="studio-stage">
                <div className={`stage-grid ${remoteStream ? `layout-${layoutMode}` : 'layout-solo'}`}>
                    {/* Local User Stream Card */}
                    <div className={`studio-video-card local-stream-card ${isAudioEnabled ? 'speaking' : ''}`}>
                        <VideoPlayer 
                            stream={stream} 
                            muted={true} 
                            label={`${hostName} (You)`}
                            isVideoEnabled={isVideoEnabled}
                            isAudioEnabled={isAudioEnabled}
                            isHost={true}
                            avatarLetter={hostInitial}
                        />
                    </div>

                    {/* Remote Guest Stream or Waiting Lobby */}
                    {remoteStream ? (
                        <div className="studio-video-card remote-stream-card speaking">
                            <VideoPlayer 
                                stream={remoteStream} 
                                muted={false} 
                                label="Guest • Co-Host"
                                isVideoEnabled={true}
                                isAudioEnabled={true}
                                isHost={false}
                                avatarLetter="G"
                            />
                        </div>
                    ) : (
                        <motion.div 
                            className="studio-waiting-lobby"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="radar-ring-wrap">
                                <div className="radar-ring ring-1" />
                                <div className="radar-ring ring-2" />
                                <div className="radar-ring ring-3" />
                                <div className="radar-center-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                </div>
                            </div>

                            <h3 className="waiting-title">Waiting for Guest to Join</h3>
                            <p className="waiting-desc">
                                Share the private studio link below. Your guest will connect directly with local crystal-clear recording.
                            </p>

                            <div className="invite-share-box">
                                <span className="invite-url-text">{window.location.href}</span>
                                <button 
                                    type="button" 
                                    className="invite-copy-btn"
                                    onClick={handleCopyInvite}
                                >
                                    {copied ? "Copied!" : "Copy Link"}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>

            {/* Floating Control Dock with Motion */}
            <motion.div 
                className="studio-control-dock"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            >
                {/* Microphone Toggle */}
                <button 
                    type="button"
                    onClick={toggleAudio} 
                    className={`dock-btn ${!isAudioEnabled ? 'is-muted' : ''}`}
                    title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                >
                    {isAudioEnabled ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                        </svg>
                    )}
                </button>

                {/* Camera Toggle */}
                <button 
                    type="button"
                    onClick={toggleVideo} 
                    className={`dock-btn ${!isVideoEnabled ? 'is-muted' : ''}`}
                    title={isVideoEnabled ? "Turn Camera Off" : "Turn Camera On"}
                >
                    {isVideoEnabled ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27l4.73 4.73H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.55-.18L19.73 23 21 21.73 3.27 2z" />
                        </svg>
                    )}
                </button>

                <div className="dock-divider" />

                {/* Centerpiece Recording Button */}
                {recordingState === 'idle' && (
                    <button 
                        type="button"
                        onClick={startRecording} 
                        className="dock-btn dock-record-btn"
                        title="Start Studio Recording"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="12" r="8" />
                        </svg>
                    </button>
                )}

                {recordingState === 'recording' && (
                    <button 
                        type="button"
                        onClick={stopRecording} 
                        className="dock-btn dock-record-btn recording-active"
                        title="Stop & Finalize Recording"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="6" width="12" height="12" rx="3" />
                        </svg>
                    </button>
                )}

                {recordingState === 'stopped' && (
                    <button 
                        type="button"
                        onClick={resetRecording} 
                        className="dock-btn"
                        title="Record Another Take"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2-8.83" />
                        </svg>
                    </button>
                )}

                <div className="dock-divider" />

                {/* Quick Share Invite */}
                <button 
                    type="button"
                    onClick={handleCopyInvite} 
                    className="dock-btn"
                    title="Copy Invite Link"
                >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                </button>

                {/* Leave Studio */}
                <button 
                    type="button"
                    onClick={handleLeave} 
                    className="dock-btn dock-leave-btn"
                    title="Leave Studio"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                </button>
            </motion.div>

            {/* Post-Recording Action Hub Bar with AnimatePresence */}
            <AnimatePresence>
                {recordingState === 'stopped' && downloadUrl && !isUploading && (
                    <motion.div 
                        className="recording-actions-bar"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <button
                            type="button"
                            onClick={handleUpload}
                            className="action-chip-btn primary"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span>Save to Cloud Library</span>
                        </button>

                        <a
                            href={downloadUrl}
                            download={`studio-session-${new Date().toISOString().split('T')[0]}.webm`}
                            className="action-chip-btn"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>Download Local WebM</span>
                        </a>

                        <button
                            type="button"
                            onClick={resetRecording}
                            className="action-chip-btn"
                        >
                            <span>Start New Take</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Uploading Cloud Progress Modal */}
            <AnimatePresence>
                {isUploading && (
                    <motion.div 
                        className="upload-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="upload-modal-card"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            <h3 style={{ fontFamily: "var(--font-display)", color: "#ffffff", fontSize: "1.4rem", margin: "0 0 8px" }}>
                                Saving Studio Recording
                            </h3>
                            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", margin: 0 }}>
                                Encoding lossless track and uploading to cloud...
                            </p>

                            <div className="progress-ring-container">
                                <svg width="96" height="96" viewBox="0 0 96 96">
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="40"
                                        fill="none"
                                        stroke="rgba(255, 255, 255, 0.08)"
                                        strokeWidth="4"
                                    />
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="40"
                                        fill="none"
                                        stroke="url(#uploadGradient)"
                                        strokeWidth="4"
                                        strokeDasharray={`${2 * Math.PI * 40}`}
                                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - uploadProgress / 100)}`}
                                        strokeLinecap="round"
                                        style={{ transition: "stroke-dashoffset 0.3s ease", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                                    />
                                    <defs>
                                        <linearGradient id="uploadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#408A71" />
                                            <stop offset="100%" stopColor="#4ea88a" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="progress-percentage">{uploadProgress}%</div>
                            </div>

                            <p className="mono" style={{ color: "var(--color-text-secondary)", fontSize: "0.74rem" }}>
                                {uploadProgress === 100 ? "Finalizing media package..." : `${uploadProgress}% uploaded to storage`}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Studio Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div 
                        className="studio-modal-backdrop" 
                        onClick={() => setShowSettings(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="settings-modal-card" 
                            onClick={(e) => e.stopPropagation()}
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        >
                            <div className="settings-header">
                                <h3>Studio Settings & Diagnostics</h3>
                                <button 
                                    type="button" 
                                    className="modal-close-button" 
                                    style={{ position: "static", width: "34px", height: "34px" }}
                                    onClick={() => setShowSettings(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="settings-row">
                                <span>Video Stream Quality</span>
                                <div style={{ display: "flex", gap: "6px" }}>
                                    {["720p", "1080p", "4K"].map((res) => (
                                        <button
                                            key={res}
                                            type="button"
                                            className="settings-pill"
                                            style={{ 
                                                background: selectedResolution === res ? "var(--color-brand)" : "transparent",
                                                color: selectedResolution === res ? "#ffffff" : "var(--color-text-secondary)",
                                                borderColor: selectedResolution === res ? "var(--color-brand)" : "var(--color-border-subtle)",
                                                cursor: "pointer"
                                            }}
                                            onClick={() => setSelectedResolution(res)}
                                        >
                                            {res}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="settings-row">
                                <span>Microphone Status</span>
                                <span className="settings-pill" style={{ color: isAudioEnabled ? "var(--color-brand)" : "#fca5a5" }}>
                                    {isAudioEnabled ? "Active & Streaming" : "Muted"}
                                </span>
                            </div>

                            <div className="settings-row">
                                <span>Camera Status</span>
                                <span className="settings-pill" style={{ color: isVideoEnabled ? "var(--color-brand)" : "#fca5a5" }}>
                                    {isVideoEnabled ? "1080p Camera Feed" : "Camera Disabled"}
                                </span>
                            </div>

                            <div className="settings-row">
                                <span>Audio Encoding</span>
                                <span className="settings-pill">Opus Lossless 48kHz</span>
                            </div>

                            <div className="settings-row" style={{ borderBottom: "none" }}>
                                <span>Room Session Code</span>
                                <span className="settings-pill mono">{id}</span>
                            </div>

                            <button 
                                type="button" 
                                className="floating-cta" 
                                style={{ width: "100%", marginTop: "16px" }}
                                onClick={() => setShowSettings(false)}
                            >
                                Done
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toasts Display with AnimatePresence */}
            <div className="toast-container">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div 
                            key={toast.id} 
                            className={`toast toast-${toast.type}`}
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <span>{toast.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}