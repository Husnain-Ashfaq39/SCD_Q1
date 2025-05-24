// Set environment to test
process.env.NODE_ENV = 'test';
process.env.PORT = 3000;
process.env.AUTH_SERVICE_URL = 'http://auth-service:3001';
process.env.BLOG_SERVICE_URL = 'http://blog-service:3002';
process.env.COMMENT_SERVICE_URL = 'http://comment-service:3003';
process.env.PROFILE_SERVICE_URL = 'http://profile-service:3004';

// This prevents tests from throwing errors due to unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
}); 