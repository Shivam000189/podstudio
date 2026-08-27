import { useState } from "react";
import { Link } from "react-router-dom";

const formats = ["Podcasts", "Interviews", "Webinars", "Live streams", "Social clips", "Video marketing", "Transcriptions"];

const features = [
  ["Record", "Record solo or with guests, in top quality."],
  ["Edit", "Use the text-based editor, and AI when you want it."],
  ["Repurpose", "Turn one recording into clips and more with AI."],
  ["Stream", "Stream in HD to multiple destinations at once."],
  ["Publish", "Publish straight to YouTube, Spotify and Apple."],
];

function Landing() {
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleFormat = (format: string) => {
    setSelectedFormats((current) => current.includes(format)
      ? current.filter((item) => item !== format)
      : [...current, format]);
  };

  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <Link to="/" className="landing-logo"><span>P</span>PODSTUDIO</Link>
        {/* <div className="landing-nav-links">
          <a href="#platform">Platform <span>v</span></a>
          <a href="#solutions">Solutions <span>v</span></a>
          <a href="#resources">Resources <span>v</span></a>
          <a href="#features">For Business</a>
          <a href="#pricing">Pricing</a>
        </div> */}
        <div className="landing-nav-actions">
          {/* <a className="landing-nav-muted" href="#contact">Contact Sales</a> */}
          <Link className="landing-nav-muted" to="/login">Login</Link>
          <Link className="landing-button landing-button-light" to="/register">Start for Free</Link>
          <button className="landing-menu-button" aria-label="Toggle navigation" onClick={() => setMobileOpen(!mobileOpen)}>
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {mobileOpen && <div className="landing-mobile-menu">
        {[["Platform", "#platform"], ["Solutions", "#solutions"], ["Resources", "#resources"], ["For Business", "#features"], ["Pricing", "#pricing"], ["Contact Sales", "#contact"]].map(([label, href]) => <a key={label} href={href} onClick={() => setMobileOpen(false)}>{label}</a>)}
        <Link to="/login" onClick={() => setMobileOpen(false)}>Login</Link>
        <Link to="/register" className="landing-mobile-cta" onClick={() => setMobileOpen(false)}>Start for Free</Link>
      </div>}

      <section className="landing-hero" id="platform">
        <div className="landing-hero-grid">
          <div className="landing-hero-copy">
            {/* <p className="landing-kicker"><i /> AI-powered content platform</p> */}
            <h1>Create your <strong>best content</strong> yet.</h1>
            <p className="landing-lede">Podstudio is the AI-powered platform that lets you record, edit, repurpose, and distribute studio-quality content as easily as if you had a crew behind you.</p>
            {/* <div className="landing-format-list" aria-label="Content formats">
              {formats.map((format) => <button key={format} className={selectedFormats.includes(format) ? "selected" : ""} onClick={() => toggleFormat(format)}><span className="landing-checkbox">{selectedFormats.includes(format) ? "x" : ""}</span>{format}</button>)}
            </div> */}
            <div className="landing-hero-actions pt-10">
              <Link to="/register" className="landing-button landing-button-primary">Start for Free <span>{"->"}</span></Link>
              <a href="#features" className="landing-button landing-button-ghost"><span className="landing-play">&#9654;</span> Watch Demo</a>
            </div>
          </div>
          <div className="landing-hero-art">
            <div className="landing-art-orbit" />
            <div className="landing-recording-window">
              <div className="landing-window-bar"><span className="landing-window-brand">PODSTUDIO</span><span>The Lighthaus</span><b><i /> REC</b></div>
              <div className="landing-video-grid"><div><img src="/piciamge.jfif" alt="Creator recording" /><span>Marsha</span></div><div className="landing-video-dark"><div className="landing-avatar">S</div><span>Stephen</span></div></div>
              <div className="landing-controls"><button aria-label="Record">&#9679;</button><button aria-label="Microphone">Mic</button><button aria-label="Camera">Cam</button><button aria-label="Share">Share</button><button aria-label="Leave" className="landing-leave">End</button></div>
            </div>
            <div className="landing-float landing-float-top"><span className="landing-float-icon">+</span><small>Recording</small><strong>4K Quality</strong></div>
            <div className="landing-float landing-float-bottom"><span className="landing-float-icon landing-green">+</span><small>AI Edit</small><strong>Ready in 2 min</strong></div>
          </div>
        </div>
      </section>

      <section className="landing-trusted" id="solutions"><p>Trusted by teams creating what is next</p><div><strong>Spotify</strong><strong>MICROSOFT</strong><strong>Vercel</strong><strong>MARVEL</strong><strong>HubSpot</strong><strong>TED</strong></div></section>

      <section className="landing-features" id="features">
        <div className="landing-section-heading"><p className="landing-kicker">One flow, every format</p><h2>End to end content creation.<br />All in one flow.</h2></div>
        <div className="landing-feature-layout"><div className="landing-feature-list">{features.map(([title, description], index) => <button key={title} className={activeFeature === index ? "active" : ""} onClick={() => setActiveFeature(index)}><strong>{title}</strong><span>{description}</span></button>)}</div><div className="landing-feature-preview"><div className="landing-preview-top"><b>RIVERSIDE</b><span>The Lighthaus</span><em><i /> REC</em><small>95% Uploading...</small></div><div className="landing-preview-body"><div><div className="landing-preview-person">{activeFeature === 0 ? "M" : "R"}</div><span>Marsha</span></div><div><div className="landing-preview-person landing-preview-alt">{activeFeature === 1 ? "E" : "S"}</div><span>Stephen</span></div></div><div className="landing-preview-footer"><span>Record</span><span>Mic</span><span>Cam</span><span>Share</span><span className="landing-preview-end">Leave</span></div></div></div>
      </section>
    </main>
  );
}

export default Landing;
