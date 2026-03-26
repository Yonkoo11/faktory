import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig, Audio, staticFile } from 'remotion'

// Colors
const GREEN = '#10b981'
const BG = '#0a0a0a'
const TEXT = '#e5e5e5'
const MUTED = '#666666'

// Intro Section (0-10s = frames 0-300)
const Intro = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const logoScale = spring({ frame, fps, from: 0, to: 1, config: { damping: 12 } })
  const titleOpacity = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: 'clamp' })
  const subtitleOpacity = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ backgroundColor: BG, justifyContent: 'center', alignItems: 'center' }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Logo */}
      <div style={{
        transform: `scale(${logoScale})`,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        marginBottom: 40,
      }}>
        <div style={{
          width: 80,
          height: 80,
          backgroundColor: GREEN,
          borderRadius: 12,
        }} />
        <span style={{
          fontSize: 96,
          fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace',
          color: TEXT,
        }}>
          <span style={{ color: GREEN }}>f</span>aktory
        </span>
      </div>

      {/* Title */}
      <h1 style={{
        opacity: titleOpacity,
        fontSize: 72,
        fontWeight: 700,
        color: TEXT,
        fontFamily: 'JetBrains Mono, monospace',
        marginBottom: 20,
        textAlign: 'center',
      }}>
        YOUR AI TREASURY AGENT
      </h1>

      {/* Subtitle */}
      <p style={{
        opacity: subtitleOpacity,
        fontSize: 48,
        color: GREEN,
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 600,
      }}>
        for B2B Commerce
      </p>
    </AbsoluteFill>
  )
}

// Problem Section (10-25s = frames 300-750)
const Problem = () => {
  const frame = useCurrentFrame()

  const lines = [
    { text: 'Every business has invoices waiting to be paid', delay: 0 },
    { text: "That's idle cash sitting in your treasury", delay: 60 },
    { text: 'Manual management costs time and money', delay: 120 },
  ]

  return (
    <AbsoluteFill style={{ backgroundColor: BG, justifyContent: 'center', alignItems: 'center', padding: 100 }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div style={{ zIndex: 1 }}>
        <h2 style={{
          fontSize: 48,
          color: MUTED,
          fontFamily: 'JetBrains Mono, monospace',
          marginBottom: 60,
          textTransform: 'uppercase',
          letterSpacing: 4,
        }}>
          The Problem
        </h2>

        {lines.map((line, i) => {
          const opacity = interpolate(frame, [line.delay, line.delay + 30], [0, 1], { extrapolateRight: 'clamp' })
          const translateY = interpolate(frame, [line.delay, line.delay + 30], [20, 0], { extrapolateRight: 'clamp' })

          return (
            <p key={i} style={{
              opacity,
              transform: `translateY(${translateY}px)`,
              fontSize: 56,
              color: TEXT,
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: 40,
              lineHeight: 1.4,
            }}>
              {i === 2 ? (
                <>
                  {line.text.split('time and money').map((part, j) => (
                    j === 0 ? part : <><span style={{ color: '#ef4444' }}>time and money</span>{part}</>
                  ))}
                </>
              ) : line.text}
            </p>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

// Solution Section (25-50s = frames 750-1500)
const Solution = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const steps = [
    { icon: '01', title: 'TOKENIZE', desc: 'Mint invoices as NFTs on Cronos', color: GREEN },
    { icon: '02', title: 'DEPOSIT', desc: 'AI deposits to yield strategies', color: '#f59e0b' },
    { icon: '03', title: 'EARN', desc: 'Watch yield accrue 24/7', color: '#8b5cf6' },
  ]

  return (
    <AbsoluteFill style={{ backgroundColor: BG, justifyContent: 'center', alignItems: 'center', padding: 100 }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div style={{ zIndex: 1, width: '100%' }}>
        <h2 style={{
          fontSize: 48,
          color: GREEN,
          fontFamily: 'JetBrains Mono, monospace',
          marginBottom: 80,
          textAlign: 'center',
        }}>
          With Faktory
        </h2>

        <div style={{ display: 'flex', gap: 60, justifyContent: 'center' }}>
          {steps.map((step, i) => {
            const delay = i * 90
            const scale = spring({ frame: frame - delay, fps, from: 0, to: 1, config: { damping: 12 } })
            const opacity = interpolate(frame, [delay, delay + 30], [0, 1], { extrapolateRight: 'clamp' })

            return (
              <div key={i} style={{
                opacity: Math.max(0, opacity),
                transform: `scale(${Math.max(0, scale)})`,
                backgroundColor: '#111111',
                border: `2px solid ${step.color}`,
                borderRadius: 12,
                padding: 48,
                width: 400,
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: 24,
                  color: MUTED,
                  fontFamily: 'JetBrains Mono, monospace',
                  marginBottom: 20,
                }}>
                  {step.icon}
                </div>
                <h3 style={{
                  fontSize: 36,
                  color: step.color,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 700,
                  marginBottom: 16,
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: 24,
                  color: MUTED,
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {step.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </AbsoluteFill>
  )
}

// Live Dashboard Section (50-70s = frames 1500-2100)
const Dashboard = () => {
  const frame = useCurrentFrame()

  const stats = [
    { label: 'TVL', value: '$125,450', color: TEXT },
    { label: 'Yield Earned', value: '+$1,247', color: GREEN },
    { label: 'Active Invoices', value: '12', color: TEXT },
    { label: 'APY Range', value: '3.5-7%', color: '#f59e0b' },
  ]

  const activities = [
    { time: 'now', msg: 'yield +$0.003 accrued', type: 'yield' },
    { time: '3s ago', msg: 'USDC APY stable at 4.25%', type: 'success' },
    { time: '7s ago', msg: 'monitoring vault positions', type: 'info' },
  ]

  return (
    <AbsoluteFill style={{ backgroundColor: BG, padding: 80 }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div style={{ zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div style={{ width: 40, height: 40, backgroundColor: GREEN, borderRadius: 8 }} />
          <span style={{ fontSize: 32, fontFamily: 'JetBrains Mono, monospace', color: TEXT }}>
            <span style={{ color: GREEN }}>f</span>aktory
          </span>
          <div style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: GREEN }} />
            <span style={{ fontSize: 20, color: GREEN, fontFamily: 'JetBrains Mono, monospace' }}>LIVE</span>
          </div>
        </div>

        {/* Portfolio Value */}
        <div style={{ marginBottom: 60 }}>
          <p style={{ fontSize: 20, color: MUTED, fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
            TOTAL PORTFOLIO VALUE
          </p>
          <p style={{ fontSize: 72, fontFamily: 'JetBrains Mono, monospace' }}>
            <span style={{ color: MUTED }}>$</span>
            <span style={{ color: GREEN }}>125,450.00</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24,
          marginBottom: 60,
        }}>
          {stats.map((stat, i) => {
            const delay = i * 15
            const opacity = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: 'clamp' })

            return (
              <div key={i} style={{
                opacity,
                backgroundColor: '#111111',
                border: '1px solid #1f1f1f',
                borderRadius: 8,
                padding: 24,
              }}>
                <p style={{ fontSize: 16, color: MUTED, fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: 32, color: stat.color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                  {stat.value}
                </p>
              </div>
            )
          })}
        </div>

        {/* Agent Activity */}
        <div style={{
          backgroundColor: '#111111',
          border: '1px solid #1f1f1f',
          borderRadius: 8,
          padding: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: GREEN }} />
            <span style={{ fontSize: 16, color: MUTED, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}>
              Agent Activity
            </span>
          </div>
          {activities.map((act, i) => {
            const delay = 60 + i * 30
            const opacity = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: 'clamp' })

            return (
              <div key={i} style={{
                opacity,
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                padding: '12px 0',
                fontSize: 20,
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                <span style={{ color: MUTED }}>&gt;</span>
                <span style={{ color: MUTED, width: 80 }}>{act.time}</span>
                <span style={{ color: act.type === 'yield' ? GREEN : act.type === 'success' ? GREEN : TEXT }}>
                  {act.msg}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </AbsoluteFill>
  )
}

// Partners Section (70-85s = frames 2100-2550)
const Partners = () => {
  const frame = useCurrentFrame()

  const partners = ['CRONOS', 'x402', 'PYTH', 'LENDLE']

  return (
    <AbsoluteFill style={{ backgroundColor: BG, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div style={{ zIndex: 1, textAlign: 'center' }}>
        <h2 style={{
          fontSize: 36,
          color: MUTED,
          fontFamily: 'JetBrains Mono, monospace',
          marginBottom: 60,
          textTransform: 'uppercase',
          letterSpacing: 4,
        }}>
          Powered By
        </h2>

        <div style={{ display: 'flex', gap: 80, justifyContent: 'center', alignItems: 'center' }}>
          {partners.map((partner, i) => {
            const delay = i * 30
            const opacity = interpolate(frame, [delay, delay + 30], [0, 1], { extrapolateRight: 'clamp' })
            const scale = interpolate(frame, [delay, delay + 30], [0.8, 1], { extrapolateRight: 'clamp' })

            return (
              <span key={i} style={{
                opacity,
                transform: `scale(${scale})`,
                fontSize: 48,
                fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace',
                color: partner === 'CRONOS' ? '#0052ff' :
                       partner === 'x402' ? GREEN :
                       partner === 'PYTH' ? '#8b5cf6' : '#f59e0b',
              }}>
                {partner}
              </span>
            )
          })}
        </div>

        <p style={{
          fontSize: 28,
          color: MUTED,
          fontFamily: 'JetBrains Mono, monospace',
          marginTop: 80,
        }}>
          Enterprise-grade DeFi infrastructure
        </p>
      </div>
    </AbsoluteFill>
  )
}

// Outro Section (85-90s = frames 2550-2700)
const Outro = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const logoScale = spring({ frame, fps, from: 0.8, to: 1, config: { damping: 12 } })
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

      <div style={{ zIndex: 1, textAlign: 'center', opacity }}>
        {/* Logo */}
        <div style={{
          transform: `scale(${logoScale})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          marginBottom: 40,
        }}>
          <div style={{
            width: 80,
            height: 80,
            backgroundColor: GREEN,
            borderRadius: 12,
          }} />
          <span style={{
            fontSize: 96,
            fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace',
            color: TEXT,
          }}>
            <span style={{ color: GREEN }}>f</span>aktory
          </span>
        </div>

        <p style={{
          fontSize: 36,
          color: TEXT,
          fontFamily: 'JetBrains Mono, monospace',
          marginBottom: 60,
        }}>
          Because your treasury should never sleep
        </p>

        <div style={{
          display: 'inline-block',
          backgroundColor: GREEN,
          color: '#000',
          padding: '20px 48px',
          borderRadius: 8,
          fontSize: 28,
          fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace',
          marginBottom: 60,
        }}>
          Start Earning Today
        </div>

        <p style={{
          fontSize: 24,
          color: MUTED,
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          Built for the Cronos x402 PayTech Hackathon
        </p>
      </div>
    </AbsoluteFill>
  )
}

// Voiceover script for TTS (timing in seconds):
// 0-10s: "Faktory - your AI treasury agent for B2B commerce"
// 10-25s: "Every business has invoices waiting to be paid. That's idle cash sitting in your treasury. Manual management costs time and money."
// 25-50s: "With Faktory, tokenize invoices as NFTs on Cronos. Our AI agent automatically deposits to yield strategies. Watch your treasury work for you 24/7."
// 50-70s: "Real-time monitoring. Live yield accrual. Autonomous rebalancing. All on-chain."
// 70-85s: "Powered by Cronos, x402 protocol, Pyth oracles, and Lendle DeFi. Enterprise-grade security."
// 85-90s: "Faktory - because your treasury should never sleep. Built for the Cronos x402 PayTech Hackathon."

// Main Demo Composition
export const FaktoryDemo = () => {
  return (
    <AbsoluteFill>
      {/* Human voiceover from ElevenLabs */}
      <Audio src={staticFile('audio/voiceover.mp3')} volume={2} startFrom={0} />

      <Sequence from={0} durationInFrames={300}>
        <Intro />
      </Sequence>
      <Sequence from={300} durationInFrames={450}>
        <Problem />
      </Sequence>
      <Sequence from={750} durationInFrames={750}>
        <Solution />
      </Sequence>
      <Sequence from={1500} durationInFrames={600}>
        <Dashboard />
      </Sequence>
      <Sequence from={2100} durationInFrames={450}>
        <Partners />
      </Sequence>
      <Sequence from={2550} durationInFrames={150}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  )
}
