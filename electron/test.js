const { app, BrowserWindow } = require('electron');
const path = require('path');

let testWindow;

async function runTest() {
  console.log('Starting E2E test...');
  
  // Create a test window
  testWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    show: false
  });
  
  // Load the HTML
  await testWindow.loadFile(path.join(__dirname, 'index.html'));
  
  console.log('Page loaded, locating elements...');
  
  // Wait for button
  await testWindow.waitForSelector('#crawlBtn', { timeout: 5000 });
  console.log('✅ Crawl button found');
  
  // Fill URL
  await testWindow.fill('#urlInput', 'example.com');
  console.log('✅ URL entered: example.com');
  
  // Click crawl
  console.log('Clicking crawl button...');
  await testWindow.click('#crawlBtn');
  
  // Wait for result
  console.log('Waiting for crawl to complete...');
  await testWindow.waitForTimeout(5000);
  
  // Get status
  const status = await testWindow.evaluate(() => document.querySelector('#status').textContent);
  console.log('Status:', status);
  
  // Get result
  const result = await testWindow.evaluate(() => document.querySelector('#result').textContent);
  console.log('Result preview:', result?.substring(0, 150));
  
  testWindow.close();
  
  if (status.includes('complete')) {
    console.log('\n✅ TEST PASSED');
  } else {
    console.log('\n❌ TEST FAILED - Status:', status);
  }
  
  app.quit();
}

app.whenReady().then(runTest).catch(err => {
  console.error('Error:', err);
  app.quit();
});