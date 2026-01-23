# Faktory - AI Memory

## Project Overview
Faktory is an AI treasury agent for B2B commerce that tokenizes invoices as NFTs on Cronos and deposits them into yield-generating DeFi strategies.

## Key Decisions
- **UI Style:** Terminal/Bloomberg aesthetic with monospace fonts, green accents (#10b981), dark theme (#0a0a0a)
- **Video Tool:** Remotion for programmatic video generation
- **Voiceover:** ElevenLabs with Brian voice
- **Tracks Selected:** x402 Agentic Finance/Payment Track + Cronos Ecosystem Integrations

## Tech Stack
- Next.js 16.1.1 with Turbopack
- React 19.2.3
- Remotion 4.0.409 for video generation
- wagmi + viem for Web3
- Tailwind CSS 4
- cmdk for command palette
- Puppeteer for screenshot capture

## Learned Context
- Remotion `staticFile()` serves from `/public` folder
- ElevenLabs voiceover needs `...` for pauses to extend duration
- Puppeteer doesn't support `:has-text()` selector (use evaluateHandle instead)
- pnpm works better than npm for this project (npm had null property errors)
- Lower CRF value = higher quality video (use --crf 18 for HQ)

## Gotchas & Warnings
- YouTube takes time to process HD - may show low quality initially
- Voiceover is 45 seconds but video is 90 seconds - audio cuts off midway
- KEYBOARD_SHORTCUTS must be exported from use-keyboard-shortcuts.ts
- Use `sleep()` helper instead of `page.waitForTimeout()` in newer Puppeteer

## File Locations
- Remotion compositions: `src/remotion/`
- Demo screenshots: `public/demo/`
- Voiceover audio: `public/audio/voiceover.mp3`
- Rendered videos: `out/`
- Capture script: `capture-interactive-demo.js`

## Reflections
- Remotion is great for programmatic videos but render times are slow (~3 min for 90s video)
- Screenshot-based demo works but lacks animation smoothness of real screen recording
- For future: consider using actual screen recording + voiceover in post for more authentic demos
