import puppeteer from 'puppeteer';

async function takeScreenshots() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // Landing page
    console.log('Taking screenshot of landing page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'screenshots/after-landing-page.png', fullPage: true });
    console.log('✓ Landing page screenshot saved');

    // Dashboard
    console.log('Taking screenshot of dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'screenshots/after-dashboard.png', fullPage: true });
    console.log('✓ Dashboard screenshot saved');

    // Mint page
    console.log('Taking screenshot of mint page...');
    await page.goto('http://localhost:3000/dashboard/mint', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'screenshots/after-mint-page.png', fullPage: true });
    console.log('✓ Mint page screenshot saved');

    console.log('\n✓ All screenshots saved to screenshots/ directory');
  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
