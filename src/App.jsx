import React, { useState, useCallback } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';

// --- Data Constants ---
const VIDEOS = [
  {
    url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081127_0992a171-d3c6-4978-8213-0ec5df8b6d63.mp4',
    label: 'Golden Hour'
  },
  {
    url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_092026_dd05b805-ea0f-40b2-8c52-332b88502592.mp4',
    label: 'Still Water'
  },
  {
    url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081042_df7202bf-bd80-4b2b-bbc6-1f09ba2870e9.mp4',
    label: 'Deep Woods'
  },
  {
    url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_080959_4cac5234-3573-464e-a5b7-76b94b8a7d61.mp4',
    label: 'Quiet Dawn'
  }
];

const NAV_LINKS = ['Manifesto', 'Features', 'Pricing', 'Login'];

export default function App() {
  const [activeVideo, setActiveVideo] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Deep Woods (index 2) triggers dark mode text color
  const isDarkMode = activeVideo === 2;

  const handleVideoSwitch = useCallback((index) => {
    if (index === activeVideo || isTransitioning) return;
    setIsTransitioning(true);
    setActiveVideo(index);
    setTimeout(() => setIsTransitioning(false), 1000);
  }, [activeVideo, isTransitioning]);

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  // Shared system-ui font style helper
  const sysStyle = { fontFamily: 'system-ui, sans-serif' };

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      {/* --- Layer 0: Background Videos --- */}
      <div className="absolute inset-0 z-0">
        {VIDEOS.map((video, index) => (
          <video
            key={index}
            src={video.url}
            autoPlay
            loop
            muted
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              activeVideo === index ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>

      {/* --- Layer 1: Overlay Texture (PNG) --- */}
      <div className="absolute inset-0 z-[1] overlay-png pointer-events-none mix-blend-overlay opacity-60" />

      {/* --- Layer 2: UI Content --- */}
      <div className={`relative z-10 flex flex-col h-full transition-colors duration-700 ${isDarkMode ? 'text-[#182C41]' : 'text-white'}`}>

        {/* Navbar */}
        <nav className="flex items-center justify-between px-6 py-6 md:px-12">
          {/* Logo */}
          <div className={`font-serif text-xl tracking-wider font-bold ${isDarkMode ? 'text-[#182C41]' : 'text-white'}`}>
            Lumora
          </div>

          {/* Desktop Nav (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-6">
            <div className={`flex items-center px-4 py-2 rounded-full ${isDarkMode ? 'bg-[#182C41]/5' : 'liquid-glass bg-white/5'}`}>
              {NAV_LINKS.map((link) => (
                <a
                  key={link}
                  href="#"
                  className={`px-3 py-1 text-sm transition-colors hover:text-purple-400 ${isDarkMode ? 'text-[#182C41]/70' : 'text-white/80'}`}
                  style={sysStyle}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className={`md:hidden p-2 rounded-full transition-colors ${isDarkMode ? 'text-[#182C41]' : 'text-white'}`}
          >
            {mobileMenuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>
        </nav>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl menu-overlay-enter">
            <div className="flex flex-col gap-8 text-center">
              {NAV_LINKS.map((link, i) => (
                <a
                  key={link}
                  href="#"
                  className={`text-3xl font-serif transition-colors hover:text-purple-400 menu-link`}
                  style={{ animationDelay: `${100 + i * 50}ms` }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link}
                </a>
              ))}
              <button
                className="mt-8 px-8 py-3 rounded-full bg-white text-black font-medium menu-button"
                style={{ animationDelay: `${100 + NAV_LINKS.length * 50}ms` }}
              >
                Get Started
              </button>
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Hero Content */}
        <main className="flex flex-col items-center text-center px-6 max-w-4xl mx-auto -mt-20">

          {/* Badge */}
          <div
            className={`mb-8 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md menu-button`}
            style={{ animationDelay: '100ms' }}
          >
            <span
              className="text-xs tracking-widest uppercase font-medium"
              style={{ ...sysStyle, color: isDarkMode ? '#182C41' : 'rgba(255,255,255,0.7)' }}
            >
              New Release v2.0
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl leading-[1.1] mb-6 font-serif">
            Clarity in an Endlessly<br />
            <span className="italic text-purple-400">Noisy Universe</span>
          </h1>

          {/* Subtext */}
          <p
            className={`max-w-lg mb-10 leading-relaxed ${isDarkMode ? 'text-[#182C41]/70' : 'text-white/60'}`}
            style={{ ...sysStyle, fontSize: '1.1rem' }}
          >
            Experience the next generation of digital focus. Distraction-free environments designed for deep work and creative flow.
          </p>

          {/* Email Input Group */}
          <div
            className="flex flex-col sm:flex-row items-center gap-3 p-2 rounded-full menu-button"
            style={{ animationDelay: '400ms' }}
          >
            <div className="relative w-full sm:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className={`w-full sm:w-64 px-5 py-3 rounded-full outline-none transition-all ${isDarkMode ? 'bg-[#182C41]/10 text-[#182C41] placeholder:text-[#182C41]/40' : 'liquid-glass bg-white/5 text-white placeholder:text-white/40'} focus:ring-2 focus:ring-purple-500/50`}
                style={{ ...sysStyle, fontSize: '0.9rem' }}
              />
            </div>
            <button className={`w-full sm:w-auto px-8 py-3 rounded-full font-medium transition-transform active:scale-95 flex items-center justify-center gap-2 ${isDarkMode ? 'bg-[#182C41] text-white' : 'bg-white text-black'}`}>
              Join Waitlist <ArrowRight size={16} />
            </button>
          </div>

          {/* Video Switcher (Dots) */}
          <div className="mt-16 flex gap-3 menu-button" style={{ animationDelay: '500ms' }}>
            {VIDEOS.map((video, index) => (
              <button
                key={index}
                onClick={() => handleVideoSwitch(index)}
                className={`group relative w-2 h-2 rounded-full transition-all duration-300 ${
                  activeVideo === index
                    ? 'w-8 bg-purple-500'
                    : 'bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Switch to ${video.label}`}
              >
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap" style={sysStyle}>
                  {video.label}
                </span>
              </button>
            ))}
          </div>

        </main>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Stats / Footer Area */}
        <footer className={`px-6 py-8 md:px-12 flex justify-between items-center text-xs uppercase tracking-widest ${isDarkMode ? 'text-[#182C41]/50' : 'text-white/30'}`} style={sysStyle}>
          <div>© 2026 Lumora Inc.</div>

          {/* Stats with Pipe Separators (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <span>10k+ Users</span>
            <span>|</span>
            <span>99.9% Uptime</span>
            <span>|</span>
            <span>Global CDN</span>
          </div>

          {/* Mobile-only Stats (No pipes) */}
          <div className="md:hidden flex gap-4">
            <span>10k+ Users</span>
            <span>99.9% Uptime</span>
          </div>
        </footer>

      </div>
    </section>
  );
}
