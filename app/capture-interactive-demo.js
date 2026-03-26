const puppeteer = require('puppeteer')
const path = require('path')

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function captureInteractiveDemo() {
  console.log('Starting detailed interactive demo capture...')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--window-size=1920,1080']
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  const demoDir = path.join(__dirname, 'public', 'demo')
  let frameNum = 1

  const capture = async (name) => {
    const filename = `${String(frameNum).padStart(2, '0')}-${name}.png`
    await page.screenshot({ path: path.join(demoDir, filename) })
    console.log(`  Captured: ${filename}`)
    frameNum++
    return filename
  }

  // Helper to find element by text content
  const findByText = async (text) => {
    return await page.evaluateHandle((searchText) => {
      const elements = document.querySelectorAll('button, a, span, h1, h2, h3, p')
      for (const el of elements) {
        if (el.textContent.toLowerCase().includes(searchText.toLowerCase())) {
          return el
        }
      }
      return null
    }, text)
  }

  try {
    // ==========================================
    // SCENE 1: DASHBOARD OVERVIEW (0-10s)
    // ==========================================
    console.log('\n=== SCENE 1: Dashboard Overview ===')

    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle0' })
    await sleep(2500)
    await capture('dashboard-overview')

    // ==========================================
    // SCENE 2: NAVIGATE TO MINT (10-15s)
    // ==========================================
    console.log('\n=== SCENE 2: Navigate to Mint ===')

    await page.goto('http://localhost:3001/dashboard/mint', { waitUntil: 'networkidle0' })
    await sleep(2000)
    await capture('mint-page-empty')

    // ==========================================
    // SCENE 3: QUICKBOOKS SECTION (15-20s)
    // ==========================================
    console.log('\n=== SCENE 3: QuickBooks Section ===')

    // Screenshot shows the QuickBooks integration option
    await capture('quickbooks-section')

    // ==========================================
    // SCENE 4: MANUAL ENTRY FORM (20-40s)
    // ==========================================
    console.log('\n=== SCENE 4: Fill Invoice Form ===')

    // Fill Client Name
    const clientInput = await page.$('input[placeholder="Acme Corporation"]')
    if (clientInput) {
      await clientInput.click()
      await sleep(300)
      await capture('client-input-focus')

      await clientInput.type('TechFlow Industries', { delay: 60 })
      await sleep(500)
      await capture('client-filled')
    }

    // Fill Amount
    const amountInput = await page.$('input[placeholder="25000"]')
    if (amountInput) {
      await amountInput.click()
      await sleep(300)

      // Clear existing value
      await amountInput.click({ clickCount: 3 })
      await amountInput.type('75000', { delay: 80 })
      await sleep(500)
      await capture('amount-filled')
    }

    // Screenshot with form partially filled
    await capture('form-progress')

    // Full form completed
    await sleep(500)
    await capture('form-complete')

    // ==========================================
    // SCENE 5: SCROLL TO BOTTOM (40-45s)
    // ==========================================
    console.log('\n=== SCENE 5: Form Bottom Section ===')

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await sleep(500)
    await capture('form-bottom')

    // ==========================================
    // SCENE 6: AI AGENT PAGE (45-70s)
    // ==========================================
    console.log('\n=== SCENE 6: AI Agent ===')

    await page.goto('http://localhost:3001/dashboard/agent', { waitUntil: 'networkidle0' })
    await sleep(2500)
    await capture('agent-overview')

    // Agent stats
    await capture('agent-stats')

    // Agent controls section
    await sleep(500)
    await capture('agent-controls')

    // Toggle auto-execute switch
    const autoSwitch = await page.$('[role="switch"]')
    if (autoSwitch) {
      await autoSwitch.click()
      await sleep(1000)
      await capture('auto-execute-enabled')
    }

    // Safety limits visible
    await capture('safety-limits')

    // Activity log section
    await page.evaluate(() => window.scrollTo(0, 500))
    await sleep(500)
    await capture('agent-activity')

    // Current tasks
    await capture('agent-tasks')

    // ==========================================
    // SCENE 7: BACK TO DASHBOARD (70-85s)
    // ==========================================
    console.log('\n=== SCENE 7: Final Dashboard ===')

    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle0' })
    await sleep(2500)
    await capture('dashboard-final')

    // Activity feed close-up
    await capture('activity-feed')

    // Stats overview
    await capture('stats-overview')

    // ==========================================
    // SCENE 8: ISSUER/PRIVACY PAGE (85-95s)
    // ==========================================
    console.log('\n=== SCENE 8: Issuer Dashboard ===')

    await page.goto('http://localhost:3001/dashboard/issuer', { waitUntil: 'networkidle0' })
    await sleep(2000)
    await capture('issuer-overview')

    await capture('issuer-privacy')

    // ==========================================
    // DONE
    // ==========================================
    console.log('\n=== CAPTURE COMPLETE ===')
    console.log(`Total frames captured: ${frameNum - 1}`)
    console.log('Screenshots saved to: public/demo/')

  } catch (error) {
    console.error('Error during capture:', error)
  } finally {
    await browser.close()
  }
}

captureInteractiveDemo()
