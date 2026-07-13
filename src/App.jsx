import { motion } from "motion/react";
import { Plus } from "lucide-react";
import "./App.css";

function LogoIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="9" height="16" rx="2.5" fill="black" transform="rotate(-35 7.5 12)" />
      <rect x="11" y="4" width="9" height="16" rx="2.5" fill="black" transform="rotate(-35 15.5 12)" />
    </svg>
  );
}

function FourDotGrid() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="3" cy="3" r="1.5" fill="white" />
      <circle cx="9" cy="3" r="1.5" fill="white" />
      <circle cx="3" cy="9" r="1.5" fill="white" />
      <circle cx="9" cy="9" r="1.5" fill="white" />
    </svg>
  );
}

function Navbar() {
  return (
    <motion.nav
      className="navbar"
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="navbar-left">
        <div className="navbar-logo">
          <LogoIcon />
          <span className="brand-text">NeuralKinetics</span>
        </div>
        <button className="menu-pill">
          <span className="menu-circle"><Plus size={12} strokeWidth={3} /></span>
          <span className="menu-label">Menu</span>
        </button>
        <div className="tags-pill">
          <span>Advanced Bionics</span>
          <span>Cognitive AI</span>
        </div>
      </div>
      <div className="navbar-right">
        <div className="adaptive-pill">
          <span className="adaptive-circle"><FourDotGrid /></span>
          <span className="adaptive-label">Adaptive Systems</span>
        </div>
      </div>
    </motion.nav>
  );
}

function BackgroundVideo() {
  return (
    <motion.div
      className="video-wrapper"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.8 }}
    >
      <video
        autoPlay
        muted
        playsInline
        loop
        className="video"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4"
      />
    </motion.div>
  );
}

function Footer() {
  return (
    <motion.div
      className="footer-wrapper"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="footer-gradient" />
      <div className="footer-content">
        <div className="footer-left">
          <motion.div
            className="subtitle-line"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="subtitle-dot" />
            <span className="subtitle-text">Best digital banking card 2026</span>
          </motion.div>
          <motion.h1
            className="footer-heading"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            One Card, Zero<br />Limits. Worldwide.
          </motion.h1>
          <motion.div
            className="footer-buttons"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <a href="#features" className="btn btn-primary">See Features</a>
            <a href="#how" className="btn btn-secondary">How It Works</a>
          </motion.div>
        </div>
        <div className="footer-right">
          <span className="tag-pill">Neuromorphic</span>
          <span className="tag-pill">AGI</span>
          <span className="tag-pill">Cybernetics</span>
        </div>
      </div>
    </motion.div>
  );
}

function App() {
  return (
    <div className="app">
      <Navbar />
      <BackgroundVideo />
      <Footer />
    </div>
  );
}

export default App;
