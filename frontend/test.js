const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle0' });
  console.log('Page loaded.');
  await page.type('#chat-input', 'Test message');
  console.log('Typed message.');
  await page.keyboard.press('Enter');
  console.log('Pressed enter.');
  await new Promise(r => setTimeout(r, 2000));
  const length = await page.$eval('#TEST_MESSAGES_LENGTH', el => el.textContent);
  console.log('Length text:', length);
  await browser.close();
})();
