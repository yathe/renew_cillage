// Add this to your existing backend
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NEXTJS_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// State management
const orderRooms = {};

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  socket.on('join-order', (orderId) => {
    socket.join(orderId);
    console.log(`Socket ${socket.id} joined room ${orderId}`);
    
    if (!orderRooms[orderId]) {
      orderRooms[orderId] = {
        driver: null,
        customers: {}
      };
    }

    // Send existing data to the new connection
    socket.emit('order-data', orderRooms[orderId]);
  });

  socket.on('driver-location', ({ orderId, latitude, longitude }) => {
    if (!orderRooms[orderId]) return;
    
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
    });
    
    io.to(orderId).emit('driver-update', orderRooms[orderId].driver);
    io.to(orderId).emit('customers-update', orderRooms[orderId].customers);
  });

  socket.on('customer-location', ({ orderId, latitude, longitude, address }) => {
    if (!orderRooms[orderId]) return;
    
    const customerData = { 
      latitude, 
      longitude, 
      address,
      id: socket.id,
      updatedAt: Date.now()
    };
    
    // Calculate distance to driver if available
    if (orderRooms[orderId].driver) {
      customerData.distance = haversineDistance(
        orderRooms[orderId].driver.latitude, 
        orderRooms[orderId].driver.longitude,
        latitude, longitude
      );
    }
    
    orderRooms[orderId].customers[socket.id] = customerData;
    io.to(orderId).emit('customer-update', customerData);
  });

  socket.on('disconnect', () => {
    Object.keys(orderRooms).forEach(orderId => {
      if (orderRooms[orderId].customers[socket.id]) {
        delete orderRooms[orderId].customers[socket.id];
        io.to(orderId).emit('customer-disconnected', socket.id);
      }
    });
  });
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

// Existing routes and server start...

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});