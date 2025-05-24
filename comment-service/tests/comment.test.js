const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const axios = require('axios');
const Comment = require('../models/Comment');

// Mock axios
jest.mock('axios');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/comments', require('../routes/comments'));

describe('Comment Service', () => {
  let mongoServer;
  
  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });
  
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  beforeEach(async () => {
    // Clear database between tests
    await Comment.deleteMany({});
    
    // Reset axios mocks
    jest.clearAllMocks();
  });
  
  // Sample data
  const sampleComment = {
    content: 'This is a test comment',
    blogId: '60d21b4667d0d8992e610c85',
    userId: '60d21b4667d0d8992e610c86',
    author: 'testuser'
  };
  
  const mockUser = {
    id: '60d21b4667d0d8992e610c86',
    username: 'testuser'
  };
  
  describe('GET /api/comments/blog/:blogId', () => {
    it('should return all comments for a blog', async () => {
      // Create test comments in the DB
      await Comment.create({
        ...sampleComment,
        content: 'Comment 1'
      });
      
      await Comment.create({
        ...sampleComment,
        content: 'Comment 2'
      });
      
      const res = await request(app).get(`/api/comments/blog/${sampleComment.blogId}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(2);
      expect(res.body[0].content).toBeDefined();
      expect(res.body[0].author).toBeDefined();
    });
    
    it('should return empty array when no comments exist', async () => {
      const res = await request(app).get('/api/comments/blog/nonexistentblogid');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([]);
    });
  });
  
  describe('POST /api/comments', () => {
    it('should create a new comment when authenticated', async () => {
      // Mock auth service response
      axios.get.mockResolvedValueOnce({
        data: { user: mockUser }
      });
      
      // Mock blog service response
      axios.get.mockResolvedValueOnce({
        data: { id: sampleComment.blogId, title: 'Test Blog' }
      });
      
      const res = await request(app)
        .post('/api/comments')
        .set('x-auth-token', 'valid-token')
        .send({
          content: sampleComment.content,
          blogId: sampleComment.blogId
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.content).toEqual(sampleComment.content);
      expect(res.body.blogId).toEqual(sampleComment.blogId);
      expect(res.body.userId).toEqual(mockUser.id);
      expect(res.body.author).toEqual(mockUser.username);
    });
    
    it('should return 401 if no token provided', async () => {
      const res = await request(app)
        .post('/api/comments')
        .send({
          content: sampleComment.content,
          blogId: sampleComment.blogId
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('No token, authorization denied');
    });
    
    it('should return 401 if token is invalid', async () => {
      // Mock auth service error response
      axios.get.mockRejectedValueOnce(new Error('Invalid token'));
      
      const res = await request(app)
        .post('/api/comments')
        .set('x-auth-token', 'invalid-token')
        .send({
          content: sampleComment.content,
          blogId: sampleComment.blogId
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Token is not valid');
    });
    
    it('should return 404 if blog does not exist', async () => {
      // Mock auth service response
      axios.get.mockResolvedValueOnce({
        data: { user: mockUser }
      });
      
      // Mock blog service error response
      axios.get.mockRejectedValueOnce(new Error('Blog not found'));
      
      const res = await request(app)
        .post('/api/comments')
        .set('x-auth-token', 'valid-token')
        .send({
          content: sampleComment.content,
          blogId: 'nonexistentblogid'
        });
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Blog not found');
    });
  });
  
  describe('PUT /api/comments/:id', () => {
    it('should update a comment when user is the author', async () => {
      // Create a test comment
      const comment = await Comment.create(sampleComment);
      
      // Mock auth service response
      axios.get.mockResolvedValueOnce({
        data: { user: mockUser }
      });
      
      const res = await request(app)
        .put(`/api/comments/${comment._id}`)
        .set('x-auth-token', 'valid-token')
        .send({
          content: 'Updated comment content'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.content).toEqual('Updated comment content');
      expect(res.body._id.toString()).toEqual(comment._id.toString());
    });
    
    it('should return 404 if comment not found', async () => {
      // Mock auth service response
      axios.get.mockResolvedValueOnce({
        data: { user: mockUser }
      });
      
      const nonexistentId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .put(`/api/comments/${nonexistentId}`)
        .set('x-auth-token', 'valid-token')
        .send({
          content: 'Updated comment content'
        });
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Comment not found');
    });
    
    it('should return 403 if user is not the author', async () => {
      // Create a test comment
      const comment = await Comment.create({
        ...sampleComment,
        userId: 'different-user-id'  // Different from mockUser.id
      });
      
      // Mock auth service response
      axios.get.mockResolvedValueOnce({
        data: { user: mockUser }
      });
      
      const res = await request(app)
        .put(`/api/comments/${comment._id}`)
        .set('x-auth-token', 'valid-token')
        .send({
          content: 'Updated comment content'
        });
      
      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('User not authorized to update this comment');
    });
  });
  
  describe('DELETE /api/comments/:id', () => {
    it('should delete a comment when user is the author', async () => {
      // Create a test comment
      const comment = await Comment.create(sampleComment);
      
      // Mock auth service response
      axios.get.mockResolvedValueOnce({
        data: { user: mockUser }
      });
      
      const res = await request(app)
        .delete(`/api/comments/${comment._id}`)
        .set('x-auth-token', 'valid-token');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Comment deleted successfully');
      
      // Verify comment was deleted
      const deletedComment = await Comment.findById(comment._id);
      expect(deletedComment).toBeNull();
    });
    
    it('should return 404 if comment not found', async () => {
      // Mock auth service response
      axios.get.mockResolvedValueOnce({
        data: { user: mockUser }
      });
      
      const nonexistentId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .delete(`/api/comments/${nonexistentId}`)
        .set('x-auth-token', 'valid-token');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Comment not found');
    });
    
    it('should return 403 if user is not the author', async () => {
      // Create a test comment
      const comment = await Comment.create({
        ...sampleComment,
        userId: 'different-user-id'  // Different from mockUser.id
      });
      
      // Mock auth service response
      axios.get.mockResolvedValueOnce({
        data: { user: mockUser }
      });
      
      const res = await request(app)
        .delete(`/api/comments/${comment._id}`)
        .set('x-auth-token', 'valid-token');
      
      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('User not authorized to delete this comment');
    });
  });
  
  describe('DELETE /api/comments/blog/:blogId', () => {
    it('should delete all comments for a blog', async () => {
      // Create test comments
      await Comment.create({
        ...sampleComment,
        content: 'Comment 1'
      });
      
      await Comment.create({
        ...sampleComment,
        content: 'Comment 2'
      });
      
      // Create a comment for a different blog
      await Comment.create({
        ...sampleComment,
        blogId: 'different-blog-id',
        content: 'Comment for different blog'
      });
      
      const res = await request(app)
        .delete(`/api/comments/blog/${sampleComment.blogId}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Comments deleted successfully');
      
      // Verify comments for the specified blog were deleted
      const remainingComments = await Comment.find({});
      expect(remainingComments.length).toEqual(1);
      expect(remainingComments[0].blogId).toEqual('different-blog-id');
    });
  });
}); 