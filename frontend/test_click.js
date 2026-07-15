const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  let alertFired = false;
  page.on('dialog', async dialog => {
    alertFired = true;
    console.log('DIALOG DETECTED:', dialog.message());
    await dialog.accept();
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://127.0.0.1:3000/chat', { waitUntil: 'networkidle0' });
  console.log('Page loaded.');
  
  await page.type('#chat-input', 'Test message');
  console.log('Typed message.');
  
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const sendButton = buttons.find(b => b.querySelector('svg.lucide-arrow-up'));
    if (sendButton) sendButton.click();
    else console.log('Send button not found');
  });
  console.log('Clicked send button.');
  
  await new Promise(r => setTimeout(r, 2000));
  
  const length = await page.$eval('#TEST_MESSAGES_LENGTH', el => el.textContent);
  console.log('Length text:', length);
  console.log('Alert Fired?', alertFired);
  
  await browser.close();
})();
