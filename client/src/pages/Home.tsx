import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import API from "../api/axios";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import {
  Radio,
  ArrowRight,
  LogOut,
  FolderOpen,
  Copy,
  Check,
  ShieldCheck,
  Mic,
  ChevronRight
} from "lucide-react";
import "../App.css";

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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } }
};

// const randomNames = [
//   "tech-talks-live",
//   "founder-stories",
//   "deep-dive-ep",
//   "creator-studio",
//   "weekly-roundup",
//   "design-critique",
//   "science-unfiltered"
// ];

export function Home() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [customRoom, setCustomRoom] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const createMutation = useMutation({
    mutationFn: fetchRoomId,
    onSuccess: (data) => {
      setTimeout(() => {
        navigate(`/rooms/${data.GenerateID}`);
      }, 300);
    },
    onError: (error) => {
      setIsCreating(false);
      console.error("Room creation failed:", error);
    },
  });

  const handleCreateInstant = () => {
    if (createMutation.isPending || isCreating) return;
    setIsCreating(true);
    const createId = crypto.randomUUID();
    createMutation.mutate({ createId });
  };

  const handleLaunchNamedRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customRoom.trim()) {
      const sanitized = encodeURIComponent(customRoom.trim().toLowerCase().replace(/\s+/g, '-'));
      navigate(`/rooms/${sanitized}`);
    } else {
      handleCreateInstant();
    }
  };


  const handleCopyQuickLink = () => {
    const demoRoom = customRoom.trim() 
      ? encodeURIComponent(customRoom.trim().toLowerCase().replace(/\s+/g, '-')) 
      : crypto.randomUUID().slice(0, 8);
    const demoUrl = `${window.location.origin}/rooms/${demoRoom}`;
    navigator.clipboard.writeText(demoUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLogout = async () => {
    if (signOut) {
      await signOut();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    }
  };

  return (
    <div className="home-studio-root">
      {/* Background ambient lighting */}
      <div className="home-ambient-glow" />

      {/* Top Header / Navigation Bar */}
      <header className="home-top-nav">
        <div className="home-nav-container">
          <div className="home-brand" onClick={() => navigate("/home")}>
            <span className="brand-logo-badge">R</span>
            <span className="brand-name">PodStudio</span>
            <span className="brand-version-pill">STUDIO</span>
          </div>

          <div className="home-nav-center">
            <button
              type="button"
              className="home-nav-pill active"
              onClick={() => navigate("/home")}
            >
              <span>Studio Hub</span>
            </button>
            <button
              type="button"
              className="home-nav-pill"
              onClick={() => navigate("/dashboard")}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Media Library</span>
            </button>
          </div>

          <div className="home-nav-user">
            {user ? (
              <div className="user-profile-menu">
                <div className="user-profile-badge">
                  <div className="user-avatar-initial">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="user-text-info">
                    <span className="user-name-text">{user.name || "Creator"}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="logout-ghost-btn"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="auth-guest-links">
                <Link to="/login" className="guest-login-link">Sign In</Link>
                <Link to="/register" className="guest-register-btn">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Spacious Content */}
      <main className="home-main-wrap">
        <motion.div
          className="home-inner-bounds"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Hero Intro Header */}
          <motion.div className="home-hero-center" variants={itemVariants}>
            
            <h1 className="home-main-title">
              Studio-Quality Remote Recording, <br className="hidden sm:inline" />
              <span className="title-gradient-accent">Made Effortless</span>.
            </h1>
            
            <p className="home-main-subtitle">
              Capture separate, uncompressed 4K video and lossless 48kHz audio tracks locally on every machine.
              Zero downloads for guests — invite with a single link.
            </p>
          </motion.div>

          {/* Primary Studio Command Bar */}
          <motion.div className="home-launcher-glass-card" variants={itemVariants}>
            <div className="launcher-card-glow" />
            
            <form onSubmit={handleLaunchNamedRoom} className="launcher-form-wrapper">
              <div className="launcher-input-group">
                <div className="launcher-input-icon">
                  {/* <Video className="w-5 h-5 text-brand" /> */}
                </div>
                <input
                  type="text"
                  placeholder="Enter studio room name..."
                  value={customRoom}
                  onChange={(e) => setCustomRoom(e.target.value)}
                  className="launcher-text-field"
                  autoFocus
                />
                <button
                  type="submit"
                  className="launcher-primary-cta"
                  disabled={isCreating || createMutation.isPending}
                >
                  {isCreating ? (
                    <>
                      <span className="spinner-mini" />
                      <span>Creating Studio...</span>
                    </>
                  ) : (
                    <>
                      <span>Launch Studio</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Action Pills Beneath */}
            <div className="launcher-sub-actions">

              <button
                type="button"
                onClick={handleCreateInstant}
                className="sub-action-chip"
                disabled={isCreating || createMutation.isPending}
                title="Create an instant session immediately"
              >
                <Radio className="w-3.5 h-3.5 text-brand" />
                <span>Instant Room</span>
              </button>

              <button
                type="button"
                onClick={handleCopyQuickLink}
                className="sub-action-chip"
                title="Copy direct invite link to clipboard"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-brand" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Link Copied!" : "Copy Quick Invite"}</span>
              </button>
            </div>
          </motion.div>

          {/* Clean Bento Quick Access Cards */}
          <motion.div className="home-dashboard-cards-grid" variants={itemVariants}>
            {/* Card 1: Media Library Shortcut */}
            <div 
              className="home-bento-card media-shortcut"
              onClick={() => navigate("/dashboard")}
            >
              <div className="bento-card-header">
                <div className="bento-icon-container">
                  <FolderOpen className="w-5 h-5 text-brand" />
                </div>
                <div className="bento-arrow-indicator">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
              <h3 className="bento-card-title">Media Library</h3>
              <p className="bento-card-desc">
                Access, stream, and download isolated master audio and video tracks from past sessions.
              </p>
              <div className="bento-card-footer">
                <span className="bento-meta-pill">View All Cloud Recordings</span>
              </div>
            </div>

            {/* Card 2: Studio Audio & Video Engine */}
            <div className="home-bento-card">
              <div className="bento-card-header">
                <div className="bento-icon-container">
                  <Mic className="w-5 h-5 text-brand" />
                </div>
                {/* <span className="bento-badge-active">4K / 48kHz</span> */}
              </div>
              <h3 className="bento-card-title">Independent Multi-Tracks</h3>
              <p className="bento-card-desc">
                Host and guests are captured locally in lossless 48kHz audio and uncompressed video with zero crosstalk.
              </p>
              <div className="bento-card-footer">
                <span className="bento-meta-pill">Zero Bandwidth Artifacts</span>
              </div>
            </div>

            {/* Card 3: Guest-Ready Direct Joining */}
            <div className="home-bento-card">
              <div className="bento-card-header">
                <div className="bento-icon-container">
                  <ShieldCheck className="w-5 h-5 text-brand" />
                </div>
                <span className="bento-badge-active">No Installs</span>
              </div>
              <h3 className="bento-card-title">Frictionless Guest Join</h3>
              <p className="bento-card-desc">
                Guests join in 2 seconds right in Chrome, Safari, Edge, or mobile with zero signups or software required.
              </p>
              <div className="bento-card-footer">
                <span className="bento-meta-pill">1-Click Private Link</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

export default Home;