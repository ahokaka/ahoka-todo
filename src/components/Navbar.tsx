export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5">
      {/* Left: Logo + wordmark */}
      <div className="flex items-center gap-2">
        <svg
          width="26"
          height="26"
          viewBox="0 0 256 256"
          fill="#ffffff"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
        </svg>
        <span className="text-white text-2xl font-playfair italic">Lithos</span>
      </div>

      {/* Center pill nav */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-2 py-2 items-center gap-1">
        <button className="text-white text-sm font-medium px-4 py-1.5 rounded-full">
          Course
        </button>
        <button className="text-white/80 text-sm font-medium px-4 py-1.5 rounded-full hover:bg-white/20 hover:text-white transition-colors">
          Field Guides
        </button>
        <button className="text-white/80 text-sm font-medium px-4 py-1.5 rounded-full hover:bg-white/20 hover:text-white transition-colors">
          Geology
        </button>
        <button className="text-white/80 text-sm font-medium px-4 py-1.5 rounded-full hover:bg-white/20 hover:text-white transition-colors">
          Plans
        </button>
        <button className="text-white/80 text-sm font-medium px-4 py-1.5 rounded-full hover:bg-white/20 hover:text-white transition-colors">
          Live Tour
        </button>
      </div>

      {/* Right: Sign Up (desktop) + hamburger (mobile) */}
      <div className="hidden md:block">
        <button className="bg-white text-gray-900 text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors">
          Sign Up
        </button>
      </div>
      <button className="md:hidden text-white" aria-label="Menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </nav>
  )
}
