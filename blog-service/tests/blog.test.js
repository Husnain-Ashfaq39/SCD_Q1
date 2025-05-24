const request = require('supertest');
const axios = require('axios');
const Blog = require('../models/Blog');
const app = require('../server');

// Mock dependencies
jest.mock('axios');
jest.mock('../models/Blog');

describe('Blog Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/blogs', () => {
    it('should return all blogs', async () => {
      const mockBlogs = [
        { _id: 'blog1', title: 'Test Blog 1', content: 'Content 1', userId: 'user1', author: 'testuser1' },
        { _id: 'blog2', title: 'Test Blog 2', content: 'Content 2', userId: 'user2', author: 'testuser2' }
      ];

      Blog.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockBlogs)
      });

      const response = await request(app).get('/api/blogs');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBlogs);
      expect(Blog.find).toHaveBeenCalled();
    });
  });

  describe('GET /api/blogs/:id', () => {
    it('should return a specific blog', async () => {
      const mockBlog = { 
        _id: 'blog1', 
        title: 'Test Blog', 
        content: 'Blog Content', 
        userId: 'user1', 
        author: 'testuser' 
      };

      Blog.findById.mockResolvedValue(mockBlog);

      const response = await request(app).get('/api/blogs/blog1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBlog);
      expect(Blog.findById).toHaveBeenCalledWith('blog1');
    });

    it('should return 404 if blog not found', async () => {
      Blog.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/blogs/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Blog not found');
    });
  });

  describe('POST /api/blogs', () => {
    it('should create a new blog', async () => {
      const mockUser = { id: 'user123', username: 'testuser' };
      const mockBlog = { 
        _id: 'blog1', 
        title: 'New Blog', 
        content: 'Blog Content',
        userId: mockUser.id,
        author: mockUser.username
      };

      // Mock auth service response
      axios.get.mockResolvedValue({ 
        data: { user: mockUser } 
      });

      // Mock blog creation
      const mockSave = jest.fn().mockResolvedValue(mockBlog);
      Blog.mockImplementation(() => ({
        save: mockSave
      }));

      const response = await request(app)
        .post('/api/blogs')
        .set('x-auth-token', 'valid_token')
        .send({
          title: 'New Blog',
          content: 'Blog Content'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockBlog);
      expect(Blog).toHaveBeenCalledWith({
        title: 'New Blog',
        content: 'Blog Content',
        userId: mockUser.id,
        author: mockUser.username
      });
      expect(mockSave).toHaveBeenCalled();
    });

    it('should return 401 if no token provided', async () => {
      const response = await request(app)
        .post('/api/blogs')
        .send({
          title: 'New Blog',
          content: 'Blog Content'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'No token, authorization denied');
    });
  });

  describe('PUT /api/blogs/:id', () => {
    it('should update a blog', async () => {
      const mockUser = { id: 'user123', username: 'testuser' };
      const mockBlog = { 
        _id: 'blog1', 
        title: 'Original Title', 
        content: 'Original Content',
        userId: mockUser.id,
        author: mockUser.username,
        save: jest.fn().mockResolvedValue({
          _id: 'blog1',
          title: 'Updated Title',
          content: 'Updated Content',
          userId: mockUser.id,
          author: mockUser.username
        })
      };

      // Mock auth service response
      axios.get.mockResolvedValue({ 
        data: { user: mockUser } 
      });

      // Mock finding blog
      Blog.findById.mockResolvedValue(mockBlog);

      const response = await request(app)
        .put('/api/blogs/blog1')
        .set('x-auth-token', 'valid_token')
        .send({
          title: 'Updated Title',
          content: 'Updated Content'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Updated Title');
      expect(response.body).toHaveProperty('content', 'Updated Content');
      expect(mockBlog.save).toHaveBeenCalled();
    });

    it('should return 404 if blog not found', async () => {
      // Mock auth service response
      axios.get.mockResolvedValue({ 
        data: { user: { id: 'user123' } } 
      });

      // Mock finding blog
      Blog.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/blogs/nonexistent')
        .set('x-auth-token', 'valid_token')
        .send({
          title: 'Updated Title',
          content: 'Updated Content'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Blog not found');
    });
  });

  describe('DELETE /api/blogs/:id', () => {
    it('should delete a blog', async () => {
      const mockUser = { id: 'user123', username: 'testuser' };
      const mockBlog = { 
        _id: 'blog1', 
        userId: mockUser.id
      };

      // Mock auth service response
      axios.get.mockResolvedValue({ 
        data: { user: mockUser } 
      });

      // Mock finding blog
      Blog.findById.mockResolvedValue(mockBlog);
      Blog.findByIdAndDelete.mockResolvedValue({});

      const response = await request(app)
        .delete('/api/blogs/blog1')
        .set('x-auth-token', 'valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Blog deleted successfully');
      expect(Blog.findByIdAndDelete).toHaveBeenCalledWith('blog1');
    });
  });
}); 