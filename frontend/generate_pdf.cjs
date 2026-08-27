const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve('presentation.html'), { waitUntil: 'networkidle' });
  await page.pdf({
    path: 'ATLAS_CRM_Presentation.pdf',
    format: 'A4',
    landscape: true,
    printBackground: true
  });
  await browser.close();
  console.log('PDF Generated Successfully!');
})();
