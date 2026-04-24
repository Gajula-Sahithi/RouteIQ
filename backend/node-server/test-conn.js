const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/status',
  method: 'GET',
};

console.log('Testing connection to http://127.0.0.1:5000/api/status...');

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
