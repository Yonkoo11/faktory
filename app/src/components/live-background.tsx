"use client"

import { useEffect, useState } from "react"

interface Particle {
  id: number
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  delay: number
}

interface DataStream {
  id: number
  x: number
  height: number
  speed: number
  delay: number
}

export function LiveBackground() {
  const [particles, setParticles] = useState<Particle[]>([])
  const [streams, setStreams] = useState<DataStream[]>([])

  useEffect(() => {
    // Generate floating particles - more of them, slightly larger
    const newParticles: Particle[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 25 + 20,
      opacity: Math.random() * 0.4 + 0.15,
      delay: Math.random() * 15,
    }))
    setParticles(newParticles)

    // Generate data streams (matrix-like effect) - more streams
    const newStreams: DataStream[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      height: Math.random() * 150 + 80,
      speed: Math.random() * 10 + 8,
      delay: Math.random() * 8,
    }))
    setStreams(newStreams)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid opacity-100" />

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-emerald-500"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `float-up ${p.speed}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Data streams */}
      {streams.map((s) => (
        <div
          key={s.id}
          className="absolute w-px bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent"
          style={{
            left: `${s.x}%`,
            height: s.height,
            animation: `data-stream ${s.speed}s linear infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* Occasional bright flicker spots */}
      <div className="absolute w-1 h-1 rounded-full bg-emerald-400/60 flicker-1" style={{ top: '20%', left: '15%' }} />
      <div className="absolute w-1 h-1 rounded-full bg-emerald-400/50 flicker-2" style={{ top: '60%', left: '75%' }} />
      <div className="absolute w-1 h-1 rounded-full bg-emerald-400/40 flicker-3" style={{ top: '80%', left: '30%' }} />

      {/* Ambient glow that moves */}
      <div className="absolute inset-0 glow-ambient" />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-radial from-emerald-500/5 to-transparent" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-radial from-emerald-500/5 to-transparent" />
    </div>
  )
}
