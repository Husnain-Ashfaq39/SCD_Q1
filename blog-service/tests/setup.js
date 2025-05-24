// Set environment to test
process.env.NODE_ENV = 'test';
process.env.PORT = 3002;
process.env.MONGO_URI = 'mongodb://localhost:27017/blog-service-test';
process.env.AUTH_SERVICE_URL = 'http://auth-service:3001';
process.env.COMMENT_SERVICE_URL = 'http://comment-service:3003';

// This prevents tests from throwing errors due to unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
}); 