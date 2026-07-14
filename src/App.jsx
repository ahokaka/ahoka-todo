import { useState, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import './index.css';

const VIDEOS = [
  {
    url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081127_0992a171-d3c6-4978-8213-0ec5df8b6d63.mp4',
    label: 'Golden Hour',
  },
  {
    url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_092026_dd05b805-ea0f-40b2-8c52-332b88502592.mp4',
    label: 'Still Water',
  },
  {
    url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081042_df7202bf-bd80-4b2b-bbc6-1f09ba2870e9.mp4',
    label: 'Deep Woods',
  },
  {
    url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_080959_4cac5234-3573-464e-a5b7-76b94b8a7d61.mp4',
    label: 'Quiet Dawn',
  },
];

const NAV_LINKS = ['How It Works', 'Features', 'Pricing', 'Community'];

function App() {
  const [activeVideo, setActiveVideo] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDarkMode = activeVideo === 2; // "Deep Woods" — index 2

  const handleVideoSwitch = useCallback(
    (index) => {
      if (index === activeVideo || isTransitioning) return;
      setIsTransitioning(true);
      setActiveVideo(index);
      setTimeout(() => setIsTransitioning(false), 1000);
    },
    [activeVideo, isTransitioning]
  );

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      {/* ── Background Video Layer (z-0) ── */}
      <div className="absolute inset-0 z-0">
        {VIDEOS.map((video, i) => (
          <video
            key={i}
            autoPlay
            muted
            playsInline
            loop
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              i === activeVideo ? 'opacity-100' : 'opacity-0'
            }`}
            src={video.url}
          />
        ))}
      </div>

      {/* ── Transparent PNG Overlay (z-[1]) ── */}
      <div className="overlay-png absolute inset-0 z-[1] pointer-events-none" />

      {/* ── Content Layer (z-10) ── */}
      <div className="relative z-10 flex flex-col h-full text-white">
        {/* ═══ Navigation ═══ */}
        <nav
          className="flex items-center justify-between px-4 sm:px-8 pt-4 sm:pt-6"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          {/* Left — Logo */}
          <div
            className="text-xl sm:text-2xl text-white italic"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Lumora
          </div>

          {/* Right — Desktop */}
          <div className="hidden md:flex items-center gap-2 liquid-glass rounded-full px-2 py-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href="#"
                className="text-white/90 hover:text-white text-sm px-3 py-1.5 transition-colors duration-200"
              >
                {link}
              </a>
            ))}
            <a
              href="#"
              className="bg-white text-black text-sm font-medium rounded-full px-4 py-1.5 ml-1 hover:opacity-90 transition-opacity"
            >
              Get Started
            </a>
          </div>

          {/* Right — Mobile Hamburger */}
          <button
            className="md:hidden liquid-glass rounded-full w-10 h-10 flex items-center justify-center relative"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <Menu
              size={20}
              className={`absolute transition-all duration-300 ${
                mobileMenuOpen
                  ? 'opacity-0 rotate-90 scale-75'
                  : 'opacity-100 rotate-0 scale-100'
              }`}
            />
            <X
              size={20}
              className={`absolute transition-all duration-300 ${
                mobileMenuOpen
                  ? 'opacity-100 rotate-0 scale-100'
                  : 'opacity-0 -rotate-90 scale-75'
              }`}
            />
          </button>
        </nav>

        {/* ═══ Mobile Menu Overlay (z-50) ═══ */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
              {NAV_LINKS.map((link, i) => (
                <a
                  key={link}
                  href="#"
                  className="text-white text-3xl"
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    transition: 'all 500ms cubic-bezier(0.4,0,0.2,1)',
                    transitionDelay: `${100 + i * 50}ms`,
                    opacity: 1,
                    transform: 'translateY(0)',
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link}
                </a>
              ))}
              <a
                href="#"
                className="bg-white text-black text-lg font-medium rounded-full px-8 py-3 mt-4"
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  transition: 'all 500ms cubic-bezier(0.4,0,0.2,1)',
                  transitionDelay: '350ms',
                  transform: 'scale(1)',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </a>
            </div>
          </div>
        )}

        {/* ═══ Spacer ═══ */}
        <div className="flex-1" />

        {/* ═══ Hero Content ═══ */}
        <div
          className={`flex flex-col items-center text-center px-4 gap-4 sm:gap-5 transition-colors duration-700 ${
            isDarkMode ? 'text-[#182C41]' : 'text-white'
          }`}
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          {/* Badge */}
          <div className="liquid-glass rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium inline-flex items-center">
            <span className={isDarkMode ? 'text-[#182C41]/90' : 'text-white/90'}>
              Over 10,000 minds already finding their clarity
            </span>
          </div>

          {/* Heading */}
          <h1
            className="text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.1] max-w-4xl font-normal"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Clarity in an Endlessly<br />Noisy Universe
          </h1>

          {/* Subtext */}
          <p className="max-w-xl leading-relaxed text-sm sm:text-base opacity-80">
            Rise above the chaos of pings, infinite scrolling, and relentless
            demands. Discover how to protect your presence and create with
            intention.
          </p>

          {/* Email Input */}
          <div className="liquid-glass rounded-full flex items-center w-full max-w-[320px] sm:max-w-sm mt-2">
            <input
              type="email"
              placeholder="Your Best Email"
              className={`bg-transparent text-sm px-4 py-2.5 flex-1 outline-none min-w-0 placeholder-white/50 ${
                isDarkMode ? 'text-[#182C41] placeholder-[#182C41]/50' : 'text-white'
              }`}
              style={{ fontFamily: 'system-ui, sans-serif' }}
            />
            <a
              href="#"
              className="bg-white text-black text-xs sm:text-sm font-medium rounded-full px-4 py-2 mr-1 whitespace-nowrap hover:opacity-90 transition-opacity flex-shrink-0"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              Get Early Access
            </a>
          </div>

          {/* Video Switcher */}
          <div className="flex items-center gap-4 sm:gap-6 mt-2 flex-wrap justify-center">
            {VIDEOS.map((video, i) => (
              <button
                key={i}
                onClick={() => handleVideoSwitch(i)}
                disabled={isTransitioning}
                className={`text-xs sm:text-sm tracking-wide pb-1 transition-all duration-300 ${
                  i === activeVideo
                    ? `font-medium ${
                        isDarkMode
                          ? 'text-[#182C41] border-b-2 border-[#182C41]'
                          : 'text-white border-b-2 border-white'
                      }`
                    : `opacity-50 hover:opacity-80 border-b-2 border-transparent ${
                        isDarkMode ? 'text-[#182C41]' : 'text-white'
                      }`
                }`}
              >
                {video.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ Spacer ═══ */}
        <div className="flex-1" />

        {/* ═══ Bottom Stats ═══ */}
        <div
          className="flex items-center justify-center gap-2 sm:gap-4 px-4 pb-6 sm:pb-8 flex-wrap text-white/70 text-xs sm:text-sm"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          <span>60+ Deep Sessions</span>
          <span className="hidden sm:inline text-white/30">|</span>
          <span>12,000+ Creators</span>
          <span className="hidden sm:inline text-white/30">|</span>
          <span>4.8 User Satisfaction</span>
          <span className="hidden sm:inline text-white/30">|</span>
          <span>Intentional-First Design</span>
        </div>
      </div>
    </section>
  );
}

export default App;
