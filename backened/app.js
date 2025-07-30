const express = require('express');
const http = require('http');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: ['http://localhost:3000'], // Your Next.js frontend URL
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));
app.use(express.json());

// In-memory storage for order data
const orderRooms = {};

// Middleware to handle SSE connections
function sseMiddleware(req, res, next) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  // Send a comment to keep connection alive
  const keepAlive = setInterval(() => {
    res.write(':keep-alive\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });

  next();
}

// SSE endpoint for drivers
app.get('/api/driver-events/:orderId', sseMiddleware, (req, res) => {
  const { orderId } = req.params;
  
  if (!orderRooms[orderId]) {
    orderRooms[orderId] = {
      driver: null,
      customers: {},
      driverClients: [],
      customerClients: []
    };
  }

  // Add this response to the driver clients
  orderRooms[orderId].driverClients.push(res);

  // Send initial state
  res.write(`event: initial\ndata: ${JSON.stringify({
    customers: Object.values(orderRooms[orderId].customers)
  })}\n\n`);
});

// SSE endpoint for customers
app.get('/api/customer-events/:orderId', sseMiddleware, (req, res) => {
  const { orderId } = req.params;
  
  if (!orderRooms[orderId]) {
    orderRooms[orderId] = {
      driver: null,
      customers: {},
      driverClients: [],
      customerClients: []
    };
  }

  // Add this response to the customer clients
  orderRooms[orderId].customerClients.push(res);

  // Send initial state
  res.write(`event: initial\ndata: ${JSON.stringify({
    driver: orderRooms[orderId].driver
  })}\n\n`);
});

// Update driver location
app.post('/api/driver-location', (req, res) => {
  const { orderId, latitude, longitude } = req.body;
  
  if (!orderRooms[orderId]) {
    orderRooms[orderId] = {
      driver: null,
      customers: {},
      driverClients: [],
      customerClients: []
    };
  }
  
  // Update driver location
  orderRooms[orderId].driver = { 
    latitude, 
    longitude,
    updatedAt: Date.now()
  };
  
  // Calculate distances to all customers
  Object.keys(orderRooms[orderId].customers).forEach(customerId => {
    const customer = orderRooms[orderId].customers[customerId];
    customer.distance = haversineDistance(
      latitude, longitude, 
      customer.latitude, customer.longitude
    );
    customer.eta = calculateETA(customer.distance);
  });

  // Notify all customer clients
  orderRooms[orderId].customerClients.forEach(client => {
    client.write(`event: driver-update\ndata: ${JSON.stringify({
      driver: orderRooms[orderId].driver
    })}\n\n`);
  });

  // Notify the driver client about all customers
  orderRooms[orderId].driverClients.forEach(client => {
    client.write(`event: customers-update\ndata: ${JSON.stringify({
      customers: Object.values(orderRooms[orderId].customers)
    })}\n\n`);
  });

  res.json({ success: true });
});

// Update customer location
app.post('/api/customer-location', (req, res) => {
  const { orderId, latitude, longitude, address, customerId } = req.body;
  
  if (!orderRooms[orderId]) {
    orderRooms[orderId] = {
      driver: null,
      customers: {},
      driverClients: [],
      customerClients: []
    };
  }
  
  // Create/update customer data
  const customerData = { 
    latitude, 
    longitude, 
    address,
    id: customerId,
    updatedAt: Date.now()
  };
  
  // Calculate distance to driver if available
  if (orderRooms[orderId].driver) {
    customerData.distance = haversineDistance(
      orderRooms[orderId].driver.latitude, 
      orderRooms[orderId].driver.longitude,
      latitude, longitude
    );
    customerData.eta = calculateETA(customerData.distance);
  }
  
  orderRooms[orderId].customers[customerId] = customerData;

  // Notify driver clients
  orderRooms[orderId].driverClients.forEach(client => {
    client.write(`event: customer-update\ndata: ${JSON.stringify({
      customer: customerData
    })}\n\n`);
  });

  res.json({ success: true });
});

// Remove disconnected clients
app.post('/api/disconnect', (req, res) => {
  const { orderId, customerId, type } = req.body;
  
  if (orderRooms[orderId]) {
    if (type === 'customer' && customerId) {
      delete orderRooms[orderId].customers[customerId];
      
      // Notify driver clients
      orderRooms[orderId].driverClients.forEach(client => {
        client.write(`event: customer-disconnected\ndata: ${JSON.stringify({
          customerId
        })}\n\n`);
      });
    }
  }
  
  res.json({ success: true });
});

// Haversine distance calculation
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Calculate ETA in minutes
function calculateETA(distanceKm) {
  const avgSpeedKmH = 30; // Average speed in km/h
  return Math.round((distanceKm / avgSpeedKmH) * 60);
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});