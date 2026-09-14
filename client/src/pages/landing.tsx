import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Video,
  Share2,
  Cloud,
  CheckCircle2,
  ArrowRight,
  Volume2,
  Layers,
  ShieldCheck,
  Sliders,
  ChevronDown,
  Star,
  Film,
  Cpu,
  Copy,
  Check
} from "lucide-react";
import "../App.css";

// Animation Variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: custom * 0.1, ease: "easeOut" }
  })
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05
    }
  }
};

// FAQ Data
const faqs = [
  {
    q: "How does PodStudio's local recording technology work?",
    a: "Unlike traditional video conference tools that record internet streams (which are prone to bandwidth drops and compression artifacts), PodStudio records high-definition 4K video and lossless 48kHz audio directly on each participant's local device, uploading uncompressed master tracks seamlessly to the cloud."
  },
  {
    q: "Do guests need to install software or register an account?",
    a: "No. Guests click your private room link and join in 2 seconds directly within Google Chrome, Apple Safari, Microsoft Edge, or Mozilla Firefox on any desktop, laptop, tablet, or phone."
  },
  {
    q: "What file formats and separate tracks do I receive?",
    a: "You receive synchronized, isolated audio and video tracks for each participant in 4K/1080p WebM and 48kHz uncompressed WAV/Opus, ready for immediate import into Premiere Pro, Final Cut, DaVinci Resolve, or Audition."
  },
  {
    q: "Is there any latency during live podcast conversations?",
    a: "None. We use ultra-low latency WebRTC peer-to-peer audio and video transmission (<20ms delay), ensuring completely natural, uninterrupted conversational flow while recording locally in full quality in the background."
  }
];

// Testimonials Data
const testimonials = [
  {
    name: "Marcus Vance",
    role: "Host of Futurecast Tech (Top 20 Technology Podcast)",
    quote: "PodStudio is the cleanest remote recording workflow we've ever used. The separate local tracks eliminated 90% of our audio cleanup time.",
    avatar: "M",
    company: "Futurecast Media"
  },
  {
    name: "Sarah Lin",
    role: "Executive Video Producer & Showrunner",
    quote: "No software installs for guests was a game-changer for our C-suite interviews. Uncompressed 4K local master feeds look like we flew out a film crew.",
    avatar: "S",
    company: "Linear Studios"
  },
  {
    name: "Dr. Ethan Wright",
    role: "Broadcaster & Creator (850K Subscribers)",
    quote: "Crystal-clear vocal richness with zero internet hiccups. The UI is crisp, minimal, and delivers broadcast-tier reliability every time.",
    avatar: "E",
    company: "DeepScience Hub"
  }
];

function Landing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"host" | "split" | "multitrack">("split");
  const [comparisonMode, setComparisonMode] = useState<"standard" | "podstudio">("podstudio");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [roomInput, setRoomInput] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const handleLaunchRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomInput.trim()) {
      navigate(`/room/${encodeURIComponent(roomInput.trim().toLowerCase().replace(/\s+/g, '-'))}`);
    } else {
      navigate('/register');
    }
  };

  const handleCopyDemoLink = () => {
    navigator.clipboard.writeText(window.location.origin + "/room/demo-studio-session");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="landing-page realix-theme">
      {/* Floating Centered Pill Navigation (Realix Signature) */}
      <div className="realix-nav-wrapper">
        <motion.header 
          className="realix-nav-pill"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Link to="/" className="realix-brand">
            <span className="brand-icon">R</span>
            <span className="brand-text">PodStudio</span>
          </Link>

          <nav className="realix-nav-links" aria-label="Main Navigation">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#comparison">Quality</a>
            <a href="#testimonials">Reviews</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="realix-nav-actions">
            <Link to="/login" className="nav-login-btn">
              Sign In
            </Link>
            <Link to="/register" className="nav-cta-btn">
              Register
            </Link>
          </div>
        </motion.header>
      </div>

      {/* HERO SECTION (Realix Prompt-to-Imagery Style Adapted to Riverside) */}
      <section className="realix-hero">
        <div className="realix-hero-content">

          {/* Main Headline */}
          <motion.h1 
            className="realix-hero-title pt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            PODSTUDIO <br /> <span>VIDEO CALLING</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            className="realix-hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Record separate, uncompressed 4K video and lossless 48kHz audio tracks directly on each participant’s machine. Zero software downloads, zero internet glitch drops.
          </motion.p>

          {/* Realix Interactive Prompt Bar (Studio Session Console) */}
          <motion.form 
            className="realix-prompt-bar"
            onSubmit={handleLaunchRoom}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <input 
              type="text" 
              placeholder="Join Link"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              className="prompt-input"
            />
            <div className="prompt-actions">
              <button type="submit" className="prompt-submit-btn">
                <span>Join Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.form>

          {/* Quick Metrics Under Prompt */}
          <motion.div 
            className="hero-specs-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="spec-item">
              <CheckCircle2 className="w-4 h-4 text-brand" />
              <span>4K Ultra HD Local Capture</span>
            </div>
            <div className="spec-item">
              <CheckCircle2 className="w-4 h-4 text-brand" />
              <span>Lossless 48kHz Opus Audio</span>
            </div>
            <div className="spec-item">
              <CheckCircle2 className="w-4 h-4 text-brand" />
              <span>Direct Browser Join (0s Setup)</span>
            </div>
          </motion.div>
        </div>

        {/* Realix Hero Interactive Studio Showcase Window */}
        <motion.div 
          className="realix-showcase-container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          <div className="realix-studio-frame">
            {/* Top Toolbar inside Frame */}
            <div className="frame-topbar">
              <div className="frame-brand">
                <span className="live-rec-dot" />
                <strong>PodStudio Live</strong>
              </div>

              <div className="frame-tab-group">
                <button 
                  type="button" 
                  className={`frame-tab ${activeTab === 'split' ? 'active' : ''}`}
                  onClick={() => setActiveTab('split')}
                >
                  Split View
                </button>
                <button 
                  type="button" 
                  className={`frame-tab ${activeTab === 'host' ? 'active' : ''}`}
                  onClick={() => setActiveTab('host')}
                >
                  Solo Spotlight
                </button>
                <button 
                  type="button" 
                  className={`frame-tab ${activeTab === 'multitrack' ? 'active' : ''}`}
                  onClick={() => setActiveTab('multitrack')}
                >
                  Multi-Track DAW
                </button>
              </div>

              <div className="frame-status-right">
                <span className="mono-rec">● REC 12:45</span>
              </div>
            </div>

            {/* Viewport Content */}
            <AnimatePresence mode="wait">
              {activeTab === "multitrack" ? (
                <motion.div 
                  key="multitrack"
                  className="frame-multitrack-view"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Track 1 */}
                  <div className="realix-track-card">
                    <div className="track-lead">
                      <div className="track-icon-box">H</div>
                      <div>
                        <strong>Alex Rivera (Host)</strong>
                        <small className="mono">Track 1 • 4K 60fps • 48kHz WAV</small>
                      </div>
                      <span className="track-badge-sync">100% Synced</span>
                    </div>
                    <div className="waveform-meter">
                      {[35, 60, 85, 95, 70, 45, 80, 100, 65, 50, 90, 80, 40, 75, 95, 60, 45, 80, 90, 55, 70, 85, 40, 60].map((val, i) => (
                        <motion.span 
                          key={i} 
                          className="wave-bar"
                          animate={{ height: [`${val * 0.35}%`, `${val}%`, `${val * 0.35}%`] }}
                          transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.04 }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Track 2 */}
                  <div className="realix-track-card">
                    <div className="track-lead">
                      <div className="track-icon-box guest">G</div>
                      <div>
                        <strong>Elena Rostova (Guest)</strong>
                        <small className="mono">Track 2 • 1080p 60fps • 48kHz WAV</small>
                      </div>
                      <span className="track-badge-sync">100% Synced</span>
                    </div>
                    <div className="waveform-meter">
                      {[50, 75, 45, 90, 60, 80, 95, 70, 40, 85, 60, 95, 50, 80, 70, 90, 45, 65, 85, 100, 55, 75, 40, 65].map((val, i) => (
                        <motion.span 
                          key={i} 
                          className="wave-bar"
                          animate={{ height: [`${val * 0.3}%`, `${val}%`, `${val * 0.3}%`] }}
                          transition={{ repeat: Infinity, duration: 1.3, delay: i * 0.05 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="videostage"
                  className={`frame-stage-view ${activeTab === 'host' ? 'layout-solo' : 'layout-split'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="stage-participant-card">
                    <div className="participant-avatar">A</div>
                    <div className="participant-info">
                      <strong>Alex Rivera</strong>
                      <span className="badge-role">HOST</span>
                    </div>
                  </div>

                  {activeTab === 'split' && (
                    <div className="stage-participant-card guest-side">
                      <div className="participant-avatar guest">E</div>
                      <div className="participant-info">
                        <strong>Elena Rostova</strong>
                        <span className="badge-role guest">GUEST</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Footer Info inside Frame */}
            {/* <div className="frame-bottom-bar">
              <div className="engine-status">
                <Cpu className="w-3.5 h-3.5 text-brand" />
                <span>Local Track Engine: <strong>Active</strong></span>
              </div>
              <div className="engine-meta">
                <span>Lossless 48kHz Audio</span>
                <span>•</span>
                <span>Sub-20ms WebRTC</span>
                <span>•</span>
                <span>Auto Cloud Sync</span>
              </div>
            </div> */}
          </div>
        </motion.div>
      </section>

      {/* METRICS / STATS STRIP */}
      <section className="realix-metrics-strip">
        <div className="section-container">
          <motion.div 
            className="metrics-row"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
          >
            <motion.div className="metric-box" variants={fadeInUp}>
              <strong className="metric-value">500,000+</strong>
              <span className="metric-title">Hours of Studio Master Audio</span>
            </motion.div>
            <motion.div className="metric-box" variants={fadeInUp}>
              <strong className="metric-value">4K HDR</strong>
              <span className="metric-title">Local Video Resolution Capture</span>
            </motion.div>
            <motion.div className="metric-box" variants={fadeInUp}>
              <strong className="metric-value">99.99%</strong>
              <span className="metric-title">Zero-Glitch Track Reliability</span>
            </motion.div>
            <motion.div className="metric-box" variants={fadeInUp}>
              <strong className="metric-value">&lt; 2 Sec</strong>
              <span className="metric-title">Guest Direct Browser Join</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS 3-STEP WORKFLOW */}
      <section id="workflow" className="realix-section">
        <div className="section-container">
          <div className="section-header-block">
            <span className="section-tag-pill mono">Production Pipeline</span>
            <h2 className="section-heading">How PodStudio Works in 3 Steps</h2>
            <p className="section-subtext">
              Studio-grade remote recording engineered for creators, producers, and remote teams.
            </p>
          </div>

          <motion.div 
            className="realix-steps-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.div className="realix-step-card" variants={fadeInUp}>
              <div className="step-num">01</div>
              <div className="step-icon-container">
                <Share2 className="w-5 h-5 text-brand" />
              </div>
              <h3>1. Create Room & Share Link</h3>
              <p>
                Launch your studio session instantly. Send the invite link to your guests. They click and join immediately in their browser with zero logins or downloads.
              </p>
            </motion.div>

            <motion.div className="realix-step-card highlight-card" variants={fadeInUp}>
              <div className="step-num">02</div>
              <div className="step-icon-container">
                <Video className="w-5 h-5 text-brand" />
              </div>
              <h3>2. Record Isolated Local Tracks</h3>
              <p>
                Hit record. PodStudio captures full 4K video and 48kHz audio directly on each participant's hardware, immunizing your session against bad WiFi drops.
              </p>
            </motion.div>

            <motion.div className="realix-step-card" variants={fadeInUp}>
              <div className="step-num">03</div>
              <div className="step-icon-container">
                <Cloud className="w-5 h-5 text-brand" />
              </div>
              <h3>3. Instant Cloud Sync & Export</h3>
              <p>
                Tracks upload seamlessly to your encrypted dashboard. Download separate multi-track WAV/WebM master files ready for your editor.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* QUALITY BENCHMARK COMPARISON */}
      <section id="comparison" className="realix-section bg-subtle">
        <div className="section-container">
          <div className="section-header-block">
            <span className="section-tag-pill mono">Benchmark</span>
            <h2 className="section-heading">Local Master vs. Meeting Apps</h2>
            <p className="section-subtext">
              See the difference between recording locally versus compressed internet streams.
            </p>
          </div>

          <div className="realix-comparison-box">
            <div className="comp-toggle-tabs">
              <button 
                type="button" 
                className={`tab-switch ${comparisonMode === 'standard' ? 'active' : ''}`}
                onClick={() => setComparisonMode('standard')}
              >
                Standard Meeting Call (Zoom / Teams)
              </button>
              <button 
                type="button" 
                className={`tab-switch ${comparisonMode === 'podstudio' ? 'active' : ''}`}
                onClick={() => setComparisonMode('podstudio')}
              >
                PodStudio Local Master
              </button>
            </div>

            <AnimatePresence mode="wait">
              {comparisonMode === "standard" ? (
                <motion.div 
                  key="std"
                  className="comp-content-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="comp-badge status-warn">⚠️ Internet Compressed Stream</div>
                  <div className="comp-columns-grid">
                    <div className="comp-feature-col">
                      <h4>Audio Stream</h4>
                      <p>Low bitrate 16kHz audio with robotic distortion, background cutouts, and internet audio dropout glitches.</p>
                      <span className="comp-pill-bad">Low Bitrate (32kbps)</span>
                    </div>
                    <div className="comp-feature-col">
                      <h4>Video Resolution</h4>
                      <p>Heavy pixelation downscaled to 720p whenever WiFi fluctuates.</p>
                      <span className="comp-pill-bad">Heavy Compression</span>
                    </div>
                    <div className="comp-feature-col">
                      <h4>Post-Production</h4>
                      <p>Flattened single track where voices overlap. Hard to equalize or clean up.</p>
                      <span className="comp-pill-bad">Single Track Flattened</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="pod"
                  className="comp-content-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="comp-badge status-good">✨ Studio-Grade Local Master</div>
                  <div className="comp-columns-grid">
                    <div className="comp-feature-col">
                      <h4>Lossless 48kHz Audio</h4>
                      <p>Full-frequency acoustic vocal depth captured locally with studio warmth and zero compression artifacts.</p>
                      <span className="comp-pill-good">Lossless 48kHz Opus</span>
                    </div>
                    <div className="comp-feature-col">
                      <h4>4K & 1080p Crystal Clear</h4>
                      <p>Full 60fps local video recorded straight from the camera sensor with zero pixelation.</p>
                      <span className="comp-pill-good">4K Ultra HD Master</span>
                    </div>
                    <div className="comp-feature-col">
                      <h4>Isolated Separate Tracks</h4>
                      <p>Independent multi-tracks for every speaker to easily cut, level, and clean up in any DAW.</p>
                      <span className="comp-pill-good">Separate WAV & WebM</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* BENTO FEATURE GRID */}
      <section id="features" className="realix-section">
        <div className="section-container">
          <div className="section-header-block">
            <span className="section-tag-pill mono">Features</span>
            <h2 className="section-heading">Built for High-Performance Production</h2>
            <p className="section-subtext">
              Precision tools designed for podcasters, educators, remote teams, and content creators.
            </p>
          </div>

          <motion.div 
            className="realix-bento-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {/* Card 1: Wide */}
            <motion.div className="bento-box bento-span-2" variants={fadeInUp}>
              <div className="bento-icon-wrap">
                <Layers className="w-5 h-5 text-brand" />
              </div>
              <div className="bento-text">
                <h3>Separate Multi-Track Recording</h3>
                <p>
                  Every participant gets their own high-fidelity audio and video track recorded locally. No cross-talk overlap, making post-production editing effortless in Premiere, Final Cut, and DaVinci.
                </p>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div className="bento-box" variants={fadeInUp}>
              <div className="bento-icon-wrap">
                <Volume2 className="w-5 h-5 text-brand" />
              </div>
              <div className="bento-text">
                <h3>Real-Time Live Audio Equalizer</h3>
                <p>
                  Built-in dynamic audio wave visualizer monitors mic levels for host and guests with active speaking detection.
                </p>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div className="bento-box" variants={fadeInUp}>
              <div className="bento-icon-wrap">
                <Cloud className="w-5 h-5 text-brand" />
              </div>
              <div className="bento-text">
                <h3>Instant Cloud Media Library</h3>
                <p>
                  Manage, search, sort, and stream your past recording sessions from a secure dashboard with instant downloads.
                </p>
              </div>
            </motion.div>

            {/* Card 4 */}
            <motion.div className="bento-box" variants={fadeInUp}>
              <div className="bento-icon-wrap">
                <Sliders className="w-5 h-5 text-brand" />
              </div>
              <div className="bento-text">
                <h3>Adaptive Studio Layouts</h3>
                <p>
                  Switch dynamically between Side-by-Side Split View, Picture-in-Picture, or Spotlight Solo frames in real-time.
                </p>
              </div>
            </motion.div>

            {/* Card 5 */}
            <motion.div className="bento-box" variants={fadeInUp}>
              <div className="bento-icon-wrap">
                <ShieldCheck className="w-5 h-5 text-brand" />
              </div>
              <div className="bento-text">
                <h3>Zero-Friction Guest Join</h3>
                <p>
                  Guests click a private invite link and enter your studio in 2 seconds. No logins or accounts required.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section id="testimonials" className="realix-section bg-subtle">
        <div className="section-container">
          <div className="section-header-block">
            <span className="section-tag-pill mono">Creator Reviews</span>
            <h2 className="section-heading">Trusted by Industry Broadcasters</h2>
            <p className="section-subtext">
              Join thousands of creators recording high-quality interviews every day.
            </p>
          </div>

          <motion.div 
            className="realix-reviews-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {testimonials.map((t, idx) => (
              <motion.div key={idx} className="review-card" variants={fadeInUp}>
                <div className="review-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current text-brand" />
                  ))}
                </div>
                <p className="review-quote">"{t.quote}"</p>
                <div className="review-author">
                  <div className="author-avatar-box">{t.avatar}</div>
                  <div>
                    <strong>{t.name}</strong>
                    <small>{t.role} • {t.company}</small>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ ACCORDION SECTION */}
      <section id="faq" className="realix-section">
        <div className="section-container" style={{ maxWidth: "840px" }}>
          <div className="section-header-block">
            <span className="section-tag-pill mono">FAQ</span>
            <h2 className="section-heading">Frequently Asked Questions</h2>
            <p className="section-subtext">
              Everything you need to know about recording with PodStudio.
            </p>
          </div>

          <div className="realix-faq-list">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className={`faq-card-item ${isOpen ? 'open' : ''}`}>
                  <button 
                    type="button" 
                    className="faq-toggle-button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`faq-chevron ${isOpen ? 'rotated' : ''}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div 
                        className="faq-body-collapse"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <div className="faq-answer-text">{faq.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HIGH IMPACT BOTTOM CTA (Realix Signature Prompt/Launch Card) */}
      <section className="realix-bottom-cta">
        <div className="section-container">
          <motion.div 
            className="bottom-cta-box"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="section-tag-pill mono">Get Started Today</span>
            <h2>Ready to Record Your Next Masterpiece?</h2>
            <p>
              Launch your studio in seconds with uncompressed local track recording. No credit card required.
            </p>

            <form onSubmit={handleLaunchRoom} className="cta-room-form">
              <input 
                type="text" 
                placeholder="Name your studio room..."
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                className="cta-room-input"
              />
              <button type="submit" className="cta-launch-btn">
                <span>Launch Free Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="realix-footer">
        <div className="section-container footer-grid-wrap">
          <div className="footer-brand-col">
            <div className="realix-brand">
              <span className="brand-icon">R</span>
              <span className="brand-text">PodStudio</span>
            </div>
            <p>
              Studio-grade remote recording suite with isolated local 4K video and 48kHz audio capture.
            </p>
          </div>

          <div className="footer-links-columns">
            <div className="footer-col-nav">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#workflow">Workflow</a>
              <a href="#comparison">Quality Benchmark</a>
              <Link to="/register">Create Room</Link>
            </div>

            <div className="footer-col-nav">
              <h4>Platform</h4>
              <Link to="/login">Sign In</Link>
              <Link to="/dashboard">Media Library</Link>
              <a href="#faq">FAQ</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="section-container footer-bottom-flex">
            <p>© {new Date().getFullYear()} PodStudio. All rights reserved.</p>
            <div className="footer-tech-chips">
              <span>HD 1080p & 4K</span>
              <span>•</span>
              <span>48kHz Opus</span>
              <span>•</span>
              <span>WebRTC &lt; 20ms</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
