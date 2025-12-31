import puppeteer from 'puppeteer'
import { mkdir } from 'fs/promises'

const pages = [
  { url: 'http://localhost:3000', name: 'after-landing-2025-12-31' },
  { url: 'http://localhost:3000/dashboard', name: 'after-dashboard-2025-12-31' },
  { url: 'http://localhost:3000/dashboard/mint', name: 'after-mint-2025-12-31' },
  { url: 'http://localhost:3000/dashboard/agent', name: 'after-agent-2025-12-31' },
]

async function takeScreenshots() {
  // Ensure screenshots directory exists
  await mkdir('screenshots', { recursive: true })

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })

    for (const { url, name } of pages) {
      console.log(`📸 Capturing ${name}...`)
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })

      // Wait a bit for animations to settle
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Take full page screenshot
      await page.screenshot({
        path: `screenshots/${name}.png`,
        fullPage: true,
      })

      console.log(`✅ Saved screenshots/${name}.png`)
    }
  } finally {
    await browser.close()
  }

  console.log('\n✨ All screenshots captured!')
}

takeScreenshots().catch(console.error)
