const https = require('https');

const shipmentData = {
  id: "TEST-001",
  origin: "Hyderabad",
  destination: "Chennai",
  carrier: "Sentinel Internal",
  cargo: "Electronics",
  driverEmail: "24211a05h1@bvrit.ac.in",
  driverPhone: "1111111111",
  driverName: "ramu",
  status: "ON_TRACK",
  currentLat: 17.385,
  currentLng: 78.4867,
  riskScore: 0,
  riskReason: "Awaiting first analysis cycle",
  lastUpdated: new Date().toISOString(),
  eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  route: [
    { lat: 17.385, lng: 78.4867 }
  ]
};

const options = {
  hostname: 'sentinellogistics-69d7b-default-rtdb.firebaseio.com',
  path: '/shipments/TEST-001.json',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('✅ Mock shipment added successfully!');
    console.log('Response:', data);
    console.log('\nShipment Details:');
    console.log('ID:', shipmentData.id);
    console.log('Driver Email:', shipmentData.driverEmail);
    console.log('Driver Name:', shipmentData.driverName);
    console.log('Driver Phone:', shipmentData.driverPhone);
    console.log('\nNow login with email 24211a05h1@bvrit.ac.in to see this shipment in Driver Portal.');
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(JSON.stringify(shipmentData));
req.end();
