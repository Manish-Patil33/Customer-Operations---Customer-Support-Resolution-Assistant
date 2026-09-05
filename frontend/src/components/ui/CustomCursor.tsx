import { useEffect, useState } from 'react'

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 })
  const [trailingPos, setTrailingPos] = useState({ x: -100, y: -100 })
  const [isHovered, setIsHovered] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])

  useEffect(() => {
    // Only enable on desktop with pointer capabilities
    if (window.matchMedia('(pointer: coarse)').matches) return

    let animationFrameId: number

    const updateMousePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
      if (!isVisible) setIsVisible(true)
    }

    const handleMouseDown = (e: MouseEvent) => {
      setIsClicked(true)
      const newRipple = { id: Date.now(), x: e.clientX, y: e.clientY }
      setRipples(prev => [...prev.slice(-4), newRipple])
    }

    const handleMouseUp = () => setIsClicked(false)
    const handleMouseLeave = () => setIsVisible(false)
    const handleMouseEnter = () => setIsVisible(true)

    // Check hover states on interactive elements
    const handleElementHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.card-hover') ||
        target.closest('.nav-item') ||
        target.closest('input') ||
        target.closest('.interactive')
      ) {
        setIsHovered(true)
      } else {
        setIsHovered(false)
      }
    }

    window.addEventListener('mousemove', updateMousePosition)
    window.addEventListener('mousemove', handleElementHover)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    // Smooth lerp for trailing aura
    const render = () => {
      setTrailingPos(prev => ({
        x: prev.x + (position.x - prev.x) * 0.15,
        y: prev.y + (position.y - prev.y) * 0.15,
      }))
      animationFrameId = requestAnimationFrame(render)
    }
    render()

    return () => {
      window.removeEventListener('mousemove', updateMousePosition)
      window.removeEventListener('mousemove', handleElementHover)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
      cancelAnimationFrame(animationFrameId)
    }
  }, [position.x, position.y, isVisible])

  // Remove old ripples after animation
  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples(prev => prev.slice(1))
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [ripples])

  if (!isVisible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Dynamic Cursor Spotlight / Background Glow Follower */}
      <div
        className="absolute rounded-full transition-transform duration-300 ease-out"
        style={{
          left: `${trailingPos.x}px`,
          top: `${trailingPos.y}px`,
          width: isHovered ? '240px' : '180px',
          height: isHovered ? '240px' : '180px',
          transform: 'translate(-50%, -50%)',
          background: isHovered
            ? 'radial-gradient(circle, rgba(123, 106, 254, 0.18) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 80%)'
            : 'radial-gradient(circle, rgba(91, 62, 248, 0.12) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 80%)',
          filter: 'blur(10px)',
        }}
      />

      {/* Outer Glowing Trailing Ring */}
      <div
        className="absolute rounded-full border border-brand-400/40 backdrop-blur-[1px] transition-all duration-150 ease-out shadow-[0_0_15px_rgba(123,106,254,0.4)]"
        style={{
          left: `${trailingPos.x}px`,
          top: `${trailingPos.y}px`,
          width: isHovered ? '48px' : isClicked ? '24px' : '36px',
          height: isHovered ? '48px' : isClicked ? '24px' : '36px',
          transform: 'translate(-50%, -50%)',
          backgroundColor: isHovered ? 'rgba(91, 62, 248, 0.12)' : 'transparent',
          borderColor: isHovered ? 'rgba(6, 182, 212, 0.8)' : 'rgba(123, 106, 254, 0.5)',
        }}
      />

      {/* Inner Precision Cursor Dot */}
      <div
        className="absolute rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] transition-transform duration-75"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: isClicked ? '4px' : '8px',
          height: isClicked ? '4px' : '8px',
          transform: 'translate(-50%, -50%)',
          backgroundColor: isHovered ? '#38bdf8' : '#818cf8',
        }}
      />

      {/* Click Ripples */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute rounded-full border border-cyan-400/80 animate-ping"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: '40px',
            height: '40px',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.6)',
          }}
        />
      ))}
    </div>
  )
}
