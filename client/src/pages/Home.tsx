import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import API from "../api/axios";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import {
  Video,
  Layers,
  Radio,
  ArrowRight,
  Sparkles,
  LogOut,
  FolderOpen,
  Home as HomeIcon,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck
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

const navItems = [
  { icon: HomeIcon, label: "Studio Hub", path: "/home" },
  { icon: FolderOpen, label: "Media Library", path: "/dashboard" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } }
};

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
    const demoUrl = `${window.location.origin}/rooms/${crypto.randomUUID().slice(0, 8)}`;
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
    <div className="home-command-shell">
      {/* Side Navigation Rail */}
      <aside className="home-rail">
        <div className="rail-brand" onClick={() => navigate("/home")}>
          <span className="brand-icon">R</span>
          <span className="brand-title">PodStudio</span>
        </div>

        <nav className="rail-nav" aria-label="Primary">
          {navItems.map(({ icon: Icon, label, path }, index) => (
            <button
              key={label}
              className={`rail-item ${index === 0 ? "active" : ""}`}
              type="button"
              onClick={() => navigate(path)}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Quick Capabilities */}
        <div className="rail-caps">
          <span className="rail-caps-title mono">STUDIO SPECS</span>
          <div className="cap-item">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
            <span>4K Local Master</span>
          </div>
          <div className="cap-item">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
            <span>48kHz Lossless WAV</span>
          </div>
          <div className="cap-item">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
            <span>Sub-20ms WebRTC</span>
          </div>
        </div>

        <div className="rail-user-zone">
          {user ? (
            <div className="user-pill">
              <div className="user-avatar">{user.name?.charAt(0)?.toUpperCase() || "U"}</div>
              <div className="user-meta">
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </div>
            </div>
          ) : (
            <div className="mini-auth-row mono">
              <Link to="/login" className="mini-link">Sign In</Link>
              <span>•</span>
              <Link to="/register" className="mini-link text-brand">Register</Link>
            </div>
          )}

          {user && (
            <button type="button" className="rail-logout" onClick={handleLogout}>
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="home-viewport">
        <motion.div 
          className="home-content-container"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Top Hero Section */}
          <motion.div className="home-hero-header" variants={itemVariants}>
            <div className="hero-badge-pill mono">
              <Radio className="w-3.5 h-3.5 text-brand" />
              <span>Broadcast Command Center</span>
            </div>
            <h1>
              Studio-Quality Remote Recording, <span className="text-brand">Simplified</span>.
            </h1>
            <p className="hero-lede">
              Create an uncompressed local recording studio in seconds. Send one link to guests — zero downloads, zero account setup required.
            </p>
          </motion.div>

          {/* Quick Launch Console & Live Card Grid */}
          <div className="home-grid-layout">
            {/* Left Card: Launch Console */}
            <motion.div className="studio-launcher-card" variants={itemVariants}>
              <div className="launcher-head">
                <div className="launcher-icon-box">
                  <Video className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3>Launch Instant Studio Room</h3>
                  <p>Start a recording session or create a custom named room.</p>
                </div>
              </div>

              <form onSubmit={handleLaunchNamedRoom} className="home-room-form">
                <label className="input-label mono">Room Name (Optional)</label>
                <div className="room-input-row">
                  <input
                    type="text"
                    placeholder="e.g. podcast-ep-14"
                    value={customRoom}
                    onChange={(e) => setCustomRoom(e.target.value)}
                    className="room-name-field"
                  />
                  <button 
                    type="submit" 
                    className="btn-launch-studio"
                    disabled={isCreating || createMutation.isPending}
                  >
                    {isCreating ? (
                      <span className="spinner-mini" />
                    ) : (
                      <>
                        <span>Launch Studio</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="launcher-actions-divider">
                <span>OR</span>
              </div>

              <div className="quick-actions-row">
                <button
                  type="button"
                  onClick={handleCreateInstant}
                  className="quick-btn-secondary"
                  disabled={isCreating || createMutation.isPending}
                >
                  <Sparkles className="w-4 h-4 text-brand" />
                  <span>Generate Random Room</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyQuickLink}
                  className="quick-btn-secondary"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-brand" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? "Link Copied!" : "Copy Quick Invite"}</span>
                </button>
              </div>
            </motion.div>

            {/* Right Card: Live Studio Preview Mockup */}
            <motion.div className="studio-preview-card" variants={itemVariants}>
              <div className="preview-topbar">
                <div className="preview-brand">
                  <span className="live-dot" />
                  <strong>Studio Monitor</strong>
                </div>
                <span className="preview-stat-pill mono">4K • 60 FPS</span>
              </div>

              <div className="preview-stage-grid">
                <div className="preview-tile">
                  <div className="tile-avatar">H</div>
                  <span className="tile-name">Host (You)</span>
                  <div className="tile-wave">
                    {[40, 80, 50, 95, 60].map((h, i) => (
                      <span key={i} className="mini-wave-bar" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <span className="tile-tag mono">4K Master</span>
                </div>

                <div className="preview-tile guest-tile">
                  <div className="tile-avatar guest">G</div>
                  <span className="tile-name">Guest (Co-Host)</span>
                  <div className="tile-wave">
                    {[60, 40, 90, 70, 50].map((h, i) => (
                      <span key={i} className="mini-wave-bar" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <span className="tile-tag mono">4K Master</span>
                </div>
              </div>

              <div className="preview-footer mono">
                <span>Lossless 48kHz WAV</span>
                <span>•</span>
                <span>Separate Tracks</span>
                <span>•</span>
                <span>Auto Sync</span>
              </div>
            </motion.div>
          </div>

          {/* Feature Highlights Bento Row */}
          <motion.div className="home-feature-strip" variants={itemVariants}>
            <div className="strip-card">
              <div className="strip-icon-wrap">
                <Layers className="w-4 h-4 text-brand" />
              </div>
              <div>
                <h4>Isolated Multi-Tracks</h4>
                <p>Host & guest audio/video recorded locally with separate master outputs.</p>
              </div>
            </div>

            <div className="strip-card">
              <div className="strip-icon-wrap">
                <ShieldCheck className="w-4 h-4 text-brand" />
              </div>
              <div>
                <h4>Zero-Friction Guest Join</h4>
                <p>1-click browser join without software installs or guest accounts.</p>
              </div>
            </div>

            <div className="strip-card">
              <div className="strip-icon-wrap">
                <FolderOpen className="w-4 h-4 text-brand" />
              </div>
              <div>
                <h4>Cloud Media Library</h4>
                <p>Manage, stream, and download past master recordings instantly.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

export default Home;