import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import applicationRoutes from './routes/applicationRoutes';
import { verifyTwilioConfig } from './services/smsService';
import loginRoutes from './routes/loginRoutes';
import profileRoutes from './routes/profileRoutes';
import logoutRoutes from './routes/logoutRoutes';
import contactsRoutes from './routes/contactsRoutes';
import groqRoutes from './routes/groqRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Environment variables check
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'SENDGRID_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// ✅ MANUAL CORS MIDDLEWARE - This will definitely work
app.use((req, res, next) => {
  // Allow all origins in development
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploaded videos
app.use('/api/uploads', express.static('uploads'));

// Routes
app.use('/api', applicationRoutes);
app.use('/api', profileRoutes);
app.use('/api', loginRoutes);
app.use('/api', logoutRoutes);
app.use('/api', contactsRoutes);
app.use('/api', groqRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      database: 'connected',
      email: 'configured',
      sms: 'configured'
    }
  });
});

// Global error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('❌ Global error handler:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 100MB.',
      error: 'File Size Limit Exceeded'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server with service validation
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Verify Twilio configuration
    const twilioCheck = await verifyTwilioConfig();
    if (!twilioCheck.success) {
      throw new Error(`Twilio configuration failed: ${twilioCheck.error}`);
    }
    
    console.log('✅ All services configured successfully');
    console.log('✅ Manual CORS middleware enabled - allowing all origins');
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Production server running on port ${PORT}`);
      console.log(`📧 Email service: SendGrid`);
      console.log(`📱 SMS service: ${process.env.TWILIO_PHONE_NUMBER}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
    });

    process.on('unhandledRejection', (err: Error, promise) => {
      console.log(`❌ Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });
    
  } catch (error: any) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();