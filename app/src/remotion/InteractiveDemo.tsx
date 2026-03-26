import { AbsoluteFill, Sequence, Img, staticFile, Audio, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion'

const GREEN = '#10b981'
const BG = '#0a0a0a'

// Caption component
const Caption = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 15, 85, 100], [0, 1, 1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' })
  const translateY = interpolate(frame, [0, 15], [20, 0], { extrapolateRight: 'clamp' })

  return (
    <div style={{
      position: 'absolute',
      bottom: 60,
      left: 60,
      right: 60,
      opacity,
      transform: `translateY(${translateY}px)`,
      zIndex: 10,
    }}>
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.9)',
        border: `2px solid ${GREEN}`,
        borderRadius: 12,
        padding: '20px 32px',
        backdropFilter: 'blur(10px)',
      }}>
        <p style={{
          fontSize: 36,
          fontFamily: 'JetBrains Mono, Inter, system-ui, sans-serif',
          color: '#fff',
          margin: 0,
          fontWeight: 600,
        }}>
          {title}
        </p>
        {subtitle && (
          <p style={{
            fontSize: 24,
            fontFamily: 'JetBrains Mono, Inter, system-ui, sans-serif',
            color: GREEN,
            margin: '12px 0 0 0',
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

// Screenshot slide with smooth transitions
const ScreenSlide = ({
  screenshot,
  caption,
  subtitle,
}: {
  screenshot: string
  caption: string
  subtitle?: string
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })
  const scale = spring({ frame, fps, from: 1.02, to: 1, config: { damping: 20 } })

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <div style={{
        opacity,
        transform: `scale(${scale})`,
        width: '100%',
        height: '100%',
      }}>
        <Img
          src={staticFile(`demo/${screenshot}`)}
          style={{
            width: 1920,
            height: 1080,
            objectFit: 'cover',
          }}
        />
      </div>
      <Caption title={caption} subtitle={subtitle} />
    </AbsoluteFill>
  )
}

// Intro animation
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
          <div style={{ width: 100, height: 100, backgroundColor: GREEN, borderRadius: 16 }} />
          <span style={{ fontSize: 120, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#e5e5e5' }}>
            <span style={{ color: GREEN }}>f</span>aktory
          </span>
        </div>
        <h1 style={{ fontSize: 56, color: '#e5e5e5', fontFamily: 'JetBrains Mono, monospace', margin: '0 0 20px 0' }}>
          AI Treasury Agent
        </h1>
        <p style={{ fontSize: 40, color: GREEN, fontFamily: 'JetBrains Mono, monospace' }}>
          for B2B Commerce
        </p>
      </div>
    </AbsoluteFill>
  )
}

// Outro
const Outro = () => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' })

  const partners = [
    { name: 'CRONOS', color: '#0052ff' },
    { name: 'x402', color: GREEN },
    { name: 'PYTH', color: '#8b5cf6' },
    { name: 'LENDLE', color: '#f59e0b' },
  ]

  return (
    <AbsoluteFill style={{ backgroundColor: BG, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

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

        <p style={{ fontSize: 40, color: '#e5e5e5', fontFamily: 'JetBrains Mono, monospace', marginBottom: 60 }}>
          Your treasury should never sleep
        </p>

        <div style={{ display: 'flex', gap: 60, justifyContent: 'center', marginBottom: 60 }}>
          {partners.map((p, i) => {
            const delay = i * 10
            const partnerOpacity = interpolate(frame, [delay + 30, delay + 50], [0, 1], { extrapolateRight: 'clamp' })
            return (
              <span key={p.name} style={{
                opacity: partnerOpacity,
                fontSize: 32,
                fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace',
                color: p.color,
              }}>
                {p.name}
              </span>
            )
          })}
        </div>

        <p style={{ fontSize: 28, color: '#666', fontFamily: 'JetBrains Mono, monospace' }}>
          Built for the Cronos x402 PayTech Hackathon
        </p>
      </div>
    </AbsoluteFill>
  )
}

// Main composition - 90 seconds
export const InteractiveDemo = () => {
  // 90 seconds at 30fps = 2700 frames
  return (
    <AbsoluteFill>
      {/* Voiceover */}
      <Audio src={staticFile('audio/voiceover.mp3')} volume={1.2} />

      {/* INTRO: 0-8s (frames 0-240) */}
      <Sequence from={0} durationInFrames={240}>
        <Intro />
      </Sequence>

      {/* DASHBOARD OVERVIEW: 8-14s (frames 240-420) */}
      <Sequence from={240} durationInFrames={180}>
        <ScreenSlide
          screenshot="01-dashboard-overview.png"
          caption="Your Treasury Dashboard"
          subtitle="Track portfolio value, yield earned, and active invoices in real-time"
        />
      </Sequence>

      {/* NAVIGATE TO MINT: 14-18s (frames 420-540) */}
      <Sequence from={420} durationInFrames={120}>
        <ScreenSlide
          screenshot="02-mint-page-empty.png"
          caption="Mint Invoice NFT"
          subtitle="Tokenize invoices on Cronos blockchain"
        />
      </Sequence>

      {/* QUICKBOOKS: 18-22s (frames 540-660) */}
      <Sequence from={540} durationInFrames={120}>
        <ScreenSlide
          screenshot="03-quickbooks-section.png"
          caption="QuickBooks Integration"
          subtitle="Import invoices directly from your accounting software"
        />
      </Sequence>

      {/* CLIENT INPUT: 22-26s (frames 660-780) */}
      <Sequence from={660} durationInFrames={120}>
        <ScreenSlide
          screenshot="05-client-filled.png"
          caption="Enter Client Details"
          subtitle="TechFlow Industries - $75,000 invoice"
        />
      </Sequence>

      {/* AMOUNT FILLED: 26-30s (frames 780-900) */}
      <Sequence from={780} durationInFrames={120}>
        <ScreenSlide
          screenshot="06-amount-filled.png"
          caption="Set Invoice Amount"
          subtitle="Support for USD, EUR, GBP currencies"
        />
      </Sequence>

      {/* FORM COMPLETE: 30-35s (frames 900-1050) */}
      <Sequence from={900} durationInFrames={150}>
        <ScreenSlide
          screenshot="08-form-complete.png"
          caption="Invoice Details Complete"
          subtitle="Data encrypted on-chain using commitment hashes"
        />
      </Sequence>

      {/* FORM BOTTOM: 35-38s (frames 1050-1140) */}
      <Sequence from={1050} durationInFrames={90}>
        <ScreenSlide
          screenshot="09-form-bottom.png"
          caption="Privacy Controls"
          subtitle="Selective disclosure - you control who sees your data"
        />
      </Sequence>

      {/* AGENT OVERVIEW: 38-44s (frames 1140-1320) */}
      <Sequence from={1140} durationInFrames={180}>
        <ScreenSlide
          screenshot="10-agent-overview.png"
          caption="AI Agent Dashboard"
          subtitle="Autonomous yield optimization running 24/7"
        />
      </Sequence>

      {/* AGENT CONTROLS: 44-50s (frames 1320-1500) */}
      <Sequence from={1320} durationInFrames={180}>
        <ScreenSlide
          screenshot="12-agent-controls.png"
          caption="Agent Controls"
          subtitle="Configure auto-execute with safety limits"
        />
      </Sequence>

      {/* AUTO-EXECUTE ENABLED: 50-56s (frames 1500-1680) */}
      <Sequence from={1500} durationInFrames={180}>
        <ScreenSlide
          screenshot="13-auto-execute-enabled.png"
          caption="Auto-Execute Enabled"
          subtitle="Agent will rebalance when confidence exceeds 70%"
        />
      </Sequence>

      {/* SAFETY LIMITS: 56-62s (frames 1680-1860) */}
      <Sequence from={1680} durationInFrames={180}>
        <ScreenSlide
          screenshot="14-safety-limits.png"
          caption="Safety Limits Active"
          subtitle="Max 50% in aggressive strategies, manual override always available"
        />
      </Sequence>

      {/* AGENT ACTIVITY: 62-68s (frames 1860-2040) */}
      <Sequence from={1860} durationInFrames={180}>
        <ScreenSlide
          screenshot="15-agent-activity.png"
          caption="Live Agent Activity"
          subtitle="Monitoring Lendle rates, Pyth feeds, vault positions"
        />
      </Sequence>

      {/* DASHBOARD FINAL: 68-74s (frames 2040-2220) */}
      <Sequence from={2040} durationInFrames={180}>
        <ScreenSlide
          screenshot="17-dashboard-final.png"
          caption="Portfolio Growing"
          subtitle="See your yield accruing in real-time"
        />
      </Sequence>

      {/* ISSUER DASHBOARD: 74-80s (frames 2220-2400) */}
      <Sequence from={2220} durationInFrames={180}>
        <ScreenSlide
          screenshot="20-issuer-overview.png"
          caption="Issuer Dashboard"
          subtitle="Manage invoice privacy and authorized access"
        />
      </Sequence>

      {/* OUTRO: 80-90s (frames 2400-2700) */}
      <Sequence from={2400} durationInFrames={300}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  )
}
