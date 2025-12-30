import puppeteer from 'puppeteer';

const pages = [
  { url: 'http://localhost:3000', name: 'landing' },
  { url: 'http://localhost:3000/dashboard', name: 'dashboard' },
  { url: 'http://localhost:3000/dashboard/mint', name: 'mint' },
];

async function takeScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const page of pages) {
    const p = await browser.newPage();
    await p.setViewport({ width: 1920, height: 1080 });
    try {
      await p.goto(page.url, { waitUntil: 'networkidle0', timeout: 30000 });
      await p.screenshot({
        path: `../screenshots/after-${page.name}-2024-12-30.png`,
        fullPage: true
      });
      console.log(`✓ ${page.name}`);
    } catch (e) {
      console.log(`✗ ${page.name}: ${e.message}`);
    }
    await p.close();
  }

  await browser.close();
  console.log('Done!');
}

takeScreenshots();
