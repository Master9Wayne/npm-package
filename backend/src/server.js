require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db.config');
const { startCronJobs } = require('./utils/cron.utils');

// Route imports
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const packageRoutes = require('./routes/package.routes');
const friendRoutes = require('./routes/friend.routes');
const pickupRoutes = require('./routes/pickup.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const communityRoutes = require('./routes/community.routes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/pickup', pickupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/community', communityRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  startCronJobs();
  app.listen(PORT, () => {
    console.log(`NPM Server running on port ${PORT}`);
  });
}

startServer();
