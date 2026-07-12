import Navbar from './components/Navbar'
import Hero from './components/Hero'

export default function App() {
  return (
    <div
      className="min-h-screen bg-white tracking-[-0.02em]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <Navbar />
      <Hero />
    </div>
  )
}
