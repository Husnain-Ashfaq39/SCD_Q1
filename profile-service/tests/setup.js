// Set environment to test
process.env.NODE_ENV = 'test';
process.env.PORT = 3004;
process.env.MONGO_URI = 'mongodb://localhost:27017/profile-service-test';
process.env.AUTH_SERVICE_URL = 'http://auth-service:3001';

// This prevents tests from throwing errors due to unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
}); 