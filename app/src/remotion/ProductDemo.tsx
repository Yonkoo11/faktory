import { AbsoluteFill, Sequence, Img, staticFile, Audio, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion'

const GREEN = '#10b981'
const BG = '#0a0a0a'

// Text overlay component
const TextOverlay = ({ text, subtitle }: { text: string; subtitle?: string }) => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <div style={{
      position: 'absolute',
      bottom: 80,
      left: 80,
      right: 80,
      opacity,
      zIndex: 10,
    }}>
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.85)',
        border: `1px solid ${GREEN}`,
        borderRadius: 8,
        padding: '24px 32px',
      }}>
        <p style={{
          fontSize: 32,
          fontFamily: 'JetBrains Mono, monospace',
          color: '#fff',
          margin: 0,
        }}>
          {text}
        </p>
        {subtitle && (
          <p style={{
            fontSize: 20,
            fontFamily: 'JetBrains Mono, monospace',
            color: GREEN,
            margin: '8px 0 0 0',
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

// Intro slide
const Intro = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const scale = spring({ frame, fps, from: 0.8, to: 1, config: { damping: 12 } })
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ backgroundColor: BG, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div style={{ opacity, transform: `scale(${scale})`, textAlign: 'center', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 40 }}>
          <div style={{ width: 80, height: 80, backgroundColor: GREEN, borderRadius: 12 }} />
          <span style={{ fontSize: 96, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#e5e5e5' }}>
            <span style={{ color: GREEN }}>f</span>aktory
          </span>
        </div>
        <h1 style={{ fontSize: 48, color: '#e5e5e5', fontFamily: 'JetBrains Mono, monospace', margin: '0 0 20px 0' }}>
          AI Treasury Agent
        </h1>
        <p style={{ fontSize: 32, color: GREEN, fontFamily: 'JetBrains Mono, monospace' }}>
          for B2B Commerce
        </p>
      </div>
    </AbsoluteFill>
  )
}

// Screenshot slide with zoom effect
const ScreenSlide = ({
  screenshotUrl,
  caption,
  subtitle,
  zoomTo
}: {
  screenshotUrl: string
  caption: string
  subtitle?: string
  zoomTo?: { x: number; y: number; scale: number }
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })

  // Zoom animation
  const zoom = zoomTo ? interpolate(frame, [30, 90], [1, zoomTo.scale], { extrapolateRight: 'clamp' }) : 1
  const translateX = zoomTo ? interpolate(frame, [30, 90], [0, -zoomTo.x * (zoomTo.scale - 1)], { extrapolateRight: 'clamp' }) : 0
  const translateY = zoomTo ? interpolate(frame, [30, 90], [0, -zoomTo.y * (zoomTo.scale - 1)], { extrapolateRight: 'clamp' }) : 0

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <div style={{
        opacity,
        transform: `scale(${zoom}) translate(${translateX}px, ${translateY}px)`,
        transformOrigin: 'center center',
      }}>
        <Img
          src={screenshotUrl}
          style={{
            width: 1920,
            height: 1080,
          }}
        />
      </div>
      <TextOverlay text={caption} subtitle={subtitle} />
    </AbsoluteFill>
  )
}

// Outro
const Outro = () => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ backgroundColor: BG, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Glow */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 800,
        height: 400,
        background: `radial-gradient(ellipse, ${GREEN}20 0%, transparent 70%)`,
      }} />

      <div style={{ opacity, textAlign: 'center', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 40 }}>
          <div style={{ width: 80, height: 80, backgroundColor: GREEN, borderRadius: 12 }} />
          <span style={{ fontSize: 96, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#e5e5e5' }}>
            <span style={{ color: GREEN }}>f</span>aktory
          </span>
        </div>

        <p style={{ fontSize: 36, color: '#e5e5e5', fontFamily: 'JetBrains Mono, monospace', marginBottom: 60 }}>
          Your treasury should never sleep
        </p>

        <div style={{ display: 'flex', gap: 60, justifyContent: 'center', marginBottom: 60 }}>
          <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#0052ff' }}>CRONOS</span>
          <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: GREEN }}>x402</span>
          <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#8b5cf6' }}>PYTH</span>
          <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#f59e0b' }}>LENDLE</span>
        </div>

        <p style={{ fontSize: 24, color: '#666', fontFamily: 'JetBrains Mono, monospace' }}>
          Built for the Cronos x402 PayTech Hackathon
        </p>
      </div>
    </AbsoluteFill>
  )
}

// Main composition - 45 seconds to match voiceover
export const ProductDemo = () => {
  return (
    <AbsoluteFill>
      {/* Voiceover */}
      <Audio src={staticFile('audio/voiceover.mp3')} volume={1.5} />

      {/* Intro: 0-8s (frames 0-240) */}
      <Sequence from={0} durationInFrames={240}>
        <Intro />
      </Sequence>

      {/* Dashboard: 8-20s (frames 240-600) */}
      <Sequence from={240} durationInFrames={360}>
        <ScreenSlide
          screenshotUrl={staticFile('demo/dashboard.png')}
          caption="Real-time portfolio dashboard"
          subtitle="Track TVL, yield, and agent activity"
        />
      </Sequence>

      {/* Mint page: 20-32s (frames 600-960) */}
      <Sequence from={600} durationInFrames={360}>
        <ScreenSlide
          screenshotUrl={staticFile('demo/mint.png')}
          caption="Tokenize invoices as NFTs"
          subtitle="Connect QuickBooks or enter manually"
        />
      </Sequence>

      {/* Agent page: 32-42s (frames 960-1260) */}
      <Sequence from={960} durationInFrames={300}>
        <ScreenSlide
          screenshotUrl={staticFile('demo/agent.png')}
          caption="AI Agent monitors and optimizes 24/7"
          subtitle="Auto-execute with safety limits"
        />
      </Sequence>

      {/* Outro: 42-48s (frames 1260-1440) */}
      <Sequence from={1260} durationInFrames={180}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  )
}
