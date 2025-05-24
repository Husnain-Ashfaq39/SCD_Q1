const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Health check endpoint for API Gateway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API Gateway is running' });
});

// Health checks for all services
app.get('/api/health', async (req, res) => {
  try {
    const serviceChecks = await Promise.allSettled([
      axios.get(`${process.env.AUTH_SERVICE_URL}/health`),
      axios.get(`${process.env.BLOG_SERVICE_URL}/health`),
      axios.get(`${process.env.COMMENT_SERVICE_URL}/health`),
      axios.get(`${process.env.PROFILE_SERVICE_URL}/health`)
    ]);
    
    const results = {
      auth: serviceChecks[0].status === 'fulfilled' ? 'up' : 'down',
      blog: serviceChecks[1].status === 'fulfilled' ? 'up' : 'down',
      comment: serviceChecks[2].status === 'fulfilled' ? 'up' : 'down',
      profile: serviceChecks[3].status === 'fulfilled' ? 'up' : 'down'
    };
    
    const allUp = Object.values(results).every(status => status === 'up');
    
    res.status(allUp ? 200 : 207).json({
      gateway: 'up',
      services: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth Service proxy
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  }
}));

// Blog Service proxy
app.use('/api/blogs', createProxyMiddleware({
  target: process.env.BLOG_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/blogs': '/api/blogs'
  }
}));

// Comment Service proxy
app.use('/api/comments', createProxyMiddleware({
  target: process.env.COMMENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/comments': '/api/comments'
  }
}));

// Profile Service proxy
app.use('/api/profile', createProxyMiddleware({
  target: process.env.PROFILE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/profile': '/api/profile'
  }
}));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`)); 