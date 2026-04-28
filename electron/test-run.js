const { spawn } = require('child_process');

async function test() {
  console.log('Starting test...');
  
  // Start backend
  const backend = spawn('.venv/bin/python', ['backend.py'], {
    cwd: '..',
    detached: true,
    stdio: 'ignore'
  });
  backend.unref();
  
  await new Promise(r => setTimeout(r, 3000));
  
  // Start Electron
  const electron = spawn('node_modules/.bin/electron', ['.'], {
    cwd: '.',
    detached: true,
    stdio: 'ignore'
  });
  electron.unref();
  
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Started. Running test...');
  
  // Make HTTP request
  const http = require('http');
  const data = JSON.stringify({ url: 'example.com' });
  
  const req = http.request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/crawl',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      const result = JSON.parse(body);
      console.log('Result success:', result.success);
      console.log('Logs:', result.logs?.map(l => l.msg).join(' | '));
      console.log('Markdown:', result.markdown?.substring(0, 50));
      process.exit(0);
    });
  });
  
  req.on('error', e => {
    console.log('Error:', e.message);
    process.exit(1);
  });
  
  req.write(data);
  req.end();
}

test();