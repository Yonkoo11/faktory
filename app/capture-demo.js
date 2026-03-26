const puppeteer = require('puppeteer')
const path = require('path')

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function captureDemo() {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  const demoDir = path.join(__dirname, 'public', 'demo')

  // Dashboard
  console.log('Capturing dashboard...')
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' })
  await sleep(2000)
  await page.screenshot({ path: path.join(demoDir, 'dashboard.png') })

  // Mint page
  console.log('Capturing mint page...')
  await page.goto('http://localhost:3000/dashboard/mint', { waitUntil: 'networkidle0' })
  await sleep(1000)
  // Fill form
  await page.type('input[placeholder="Acme Corporation"]', 'TechFlow Industries')
  await page.type('input[placeholder="25000"]', '75000')
  await sleep(500)
  await page.screenshot({ path: path.join(demoDir, 'mint.png') })

  // Agent page
  console.log('Capturing agent page...')
  await page.goto('http://localhost:3000/dashboard/agent', { waitUntil: 'networkidle0' })
  await sleep(2000)
  await page.screenshot({ path: path.join(demoDir, 'agent.png') })

  await browser.close()
  console.log('Done! Screenshots saved to public/demo/')
}

captureDemo().catch(console.error)
