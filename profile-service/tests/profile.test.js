const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const axios = require('axios');
const Profile = require('../models/Profile');

// Mock axios
jest.mock('axios');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/profile', require('../routes/profile'));

describe('Profile Service', () => {
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
    await Profile.deleteMany({});
    
    // Reset axios mocks
    jest.clearAllMocks();
  });
  
  // Sample data
  const sampleProfile = {
    userId: '60d21b4667d0d8992e610c86',
    bio: 'Test bio',
    avatar: 'https://example.com/avatar.jpg',
    website: 'https://example.com',
    location: 'Test Location',
    social: {
      twitter: 'twitter_handle',
      facebook: 'facebook_handle',
      linkedin: 'linkedin_handle',
      instagram: 'instagram_handle'
    }
  };
  
  const mockUser = {
    id: '60d21b4667d0d8992e610c86',
    username: 'testuser'
  };
  
  describe('GET /api/profile/:userId', () => {
    it('should return a profile when it exists', async () => {
      // Create a test profile
      await Profile.create(sampleProfile);
      
      const res = await request(app).get(`/api/profile/${sampleProfile.userId}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.userId).toEqual(sampleProfile.userId);
      expect(res.body.bio).toEqual(sampleProfile.bio);
      expect(res.body.avatar).toEqual(sampleProfile.avatar);
      expect(res.body.website).toEqual(sampleProfile.website);
      expect(res.body.location).toEqual(sampleProfile.location);
      expect(res.body.social).toBeDefined();
      expect(res.body.social.twitter).toEqual(sampleProfile.social.twitter);
    });
    
    it('should return 404 when profile does not exist', async () => {
      const res = await request(app).get('/api/profile/nonexistentuserid');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Profile not found');
    });
  });
  
  describe('PUT /api/profile', () => {
    it('should create a new profile if it does not exist', async () => {
      // Mock auth service response
      axios.get.mockResolvedValueOnce({
        data: { user: mockUser }
      });
      
      const updateData = {
        bio: 'New test bio',
        website: 'https://newexample.com'
      };
      
      const res = await request(app)
        .put('/api/profile')
        .set('x-auth-token', 'valid-token')
        .send(updateData);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.userId).toEqual(mockUser.id);
      expect(res.body.bio).toEqual(updateData.bio);
      expect(res.body.website).toEqual(updateData.website);
      expect(res.body.avatar).toEqual('');
      expect(res.body.location).toEqual('');
      expect(res.body.social).toBeDefined();
    });
    
    it('should update an existing profile', async () => {
      // Create a test profile
      await Profile.create(sampleProfile);
      
      // Mock auth service response
      axios.get.mockResolvedValueOnce({
        data: { user: mockUser }
      });
      
      const updateData = {
        bio: 'Updated bio',
        location: 'Updated Location',
        social: {
          twitter: 'updated_twitter'
        }
      };
      
      const res = await request(app)
        .put('/api/profile')
        .set('x-auth-token', 'valid-token')
        .send(updateData);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.userId).toEqual(mockUser.id);
      expect(res.body.bio).toEqual(updateData.bio);
      expect(res.body.location).toEqual(updateData.location);
      expect(res.body.avatar).toEqual(sampleProfile.avatar); // Unchanged
      expect(res.body.website).toEqual(sampleProfile.website); // Unchanged
      expect(res.body.social.twitter).toEqual(updateData.social.twitter);
      expect(res.body.social.facebook).toEqual(sampleProfile.social.facebook); // Unchanged
    });
    
    it('should return 401 if no token provided', async () => {
      const res = await request(app)
        .put('/api/profile')
        .send({
          bio: 'Test bio'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('No token, authorization denied');
    });
    
    it('should return 401 if token is invalid', async () => {
      // Mock auth service error response
      axios.get.mockRejectedValueOnce(new Error('Invalid token'));
      
      const res = await request(app)
        .put('/api/profile')
        .set('x-auth-token', 'invalid-token')
        .send({
          bio: 'Test bio'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Token is not valid');
    });
  });
  
  describe('DELETE /api/profile', () => {
    it('should delete a profile', async () => {
      // Create a test profile
      await Profile.create(sampleProfile);
      
      // Mock auth service response
      axios.get.mockResolvedValueOnce({
        data: { user: mockUser }
      });
      
      const res = await request(app)
        .delete('/api/profile')
        .set('x-auth-token', 'valid-token');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Profile deleted successfully');
      
      // Verify profile was deleted
      const deletedProfile = await Profile.findOne({ userId: mockUser.id });
      expect(deletedProfile).toBeNull();
    });
    
    it('should return 404 if profile not found', async () => {
      // Mock auth service response - with a user that has no profile
      axios.get.mockResolvedValueOnce({
        data: { user: mockUser }
      });
      
      const res = await request(app)
        .delete('/api/profile')
        .set('x-auth-token', 'valid-token');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Profile not found');
    });
    
    it('should return 401 if no token provided', async () => {
      const res = await request(app)
        .delete('/api/profile');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('No token, authorization denied');
    });
    
    it('should return 401 if token is invalid', async () => {
      // Mock auth service error response
      axios.get.mockRejectedValueOnce(new Error('Invalid token'));
      
      const res = await request(app)
        .delete('/api/profile')
        .set('x-auth-token', 'invalid-token');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Token is not valid');
    });
  });
}); 