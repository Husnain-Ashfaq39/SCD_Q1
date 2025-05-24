// Set environment to test
process.env.NODE_ENV = 'test';
process.env.PORT = 3001;
process.env.MONGO_URI = 'mongodb://localhost:27017/auth-service-test';
process.env.JWT_SECRET = 'test-jwt-secret';

// This prevents tests from throwing errors due to unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
}); 