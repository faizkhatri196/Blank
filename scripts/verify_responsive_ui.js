const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

async function verifyResponsive() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const outDir = path.resolve('C:\\Users\\Infinity\\.gemini\\antigravity-ide\\brain\\6d9f10d2-d683-4268-8bca-47b0fee7cb12\\responsive_screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const viewports = [
    { width: 320, height: 844, name: '320px_iphone_se' },
    { width: 360, height: 800, name: '360px_android_standard' },
    { width: 375, height: 812, name: '375px_iphone_mini' },
    { width: 390, height: 844, name: '390px_iphone_13_14' },
    { width: 414, height: 896, name: '414px_iphone_xr_plus' },
    { width: 1280, height: 800, name: '1280px_desktop' },
  ];

  const results = [];

  for (const vp of viewports) {
    console.log(`\nTesting viewport: ${vp.width}x${vp.height} (${vp.name})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: vp.width < 768
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();
    await page.goto('http://localhost:5173/customer', { waitUntil: 'networkidle' });
    await delay(1000);

    // Measure horizontal overflow
    const overflowInfo = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
      const clientWidth = doc.clientWidth;
      const hasHorizontalScroll = scrollWidth > clientWidth;
      return {
        scrollWidth,
        clientWidth,
        hasHorizontalScroll,
        diff: scrollWidth - clientWidth,
      };
    });

    console.log(`  Overflow check: clientWidth=${overflowInfo.clientWidth}px, scrollWidth=${overflowInfo.scrollWidth}px, hasScroll=${overflowInfo.hasHorizontalScroll}`);

    const screenshotPath = path.join(outDir, `${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`  Captured screenshot: ${screenshotPath}`);

    // If 320px, test interactions: mobile menu & share button
    if (vp.width === 320) {
      console.log('  Testing mobile menu drawer at 320px...');
      const menuBtn = await page.locator('button[aria-label="Toggle navigation and account menu"]');
      if (await menuBtn.isVisible()) {
        await menuBtn.click();
        await delay(500);
        const menuScreenshot = path.join(outDir, '320px_menu_open.png');
        await page.screenshot({ path: menuScreenshot });
        console.log(`  Captured menu open: ${menuScreenshot}`);
        // Close menu
        await menuBtn.click();
        await delay(300);
      }

      console.log('  Testing "Share Servora" Community CTA at 320px...');
      const shareBtn = await page.locator('button[aria-label="Share Servora with local service businesses"]');
      if (await shareBtn.isVisible()) {
        await shareBtn.click();
        await delay(500);
        const shareText = await shareBtn.innerText();
        const shareScreenshot = path.join(outDir, '320px_share_copied.png');
        await page.screenshot({ path: shareScreenshot });
        console.log(`  Share button state: "${shareText}", captured: ${shareScreenshot}`);
      }
    }

    results.push({
      viewport: `${vp.width}x${vp.height}`,
      name: vp.name,
      ...overflowInfo,
    });

    await context.close();
  }

  await browser.close();

  console.log('\n=====================================================');
  console.log('RESPONSIVE VERIFICATION RESULTS TABLE:');
  console.table(results);
  console.log('=====================================================');
}

verifyResponsive().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
