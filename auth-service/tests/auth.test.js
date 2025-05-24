const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const app = require('../server');

// Mock dependencies
jest.mock('../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      // Mock implementation
      const mockSave = jest.fn().mockResolvedValue({});
      User.findOne.mockResolvedValue(null);
      User.mockImplementation(() => ({
        save: mockSave
      }));
      bcrypt.hash.mockResolvedValue('hashedPassword');

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(User).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword'
      });
      expect(mockSave).toHaveBeenCalled();
    });

    it('should return error if user already exists', async () => {
      User.findOne.mockResolvedValue({ username: 'testuser', email: 'test@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user and return token', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedPassword',
        username: 'testuser'
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mocked_token');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token', 'mocked_token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser._id, email: mockUser.email, username: mockUser.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should return error if user does not exist', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid email or password');
    });

    it('should return error if password is incorrect', async () => {
      User.findOne.mockResolvedValue({ email: 'test@example.com', password: 'hashedPassword' });
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid email or password');
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should verify token and return user info', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com'
      };

      jwt.verify.mockReturnValue({ id: 'user123' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('x-auth-token', 'valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isValid', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', mockUser._id);
      expect(response.body.user).toHaveProperty('username', mockUser.username);
      expect(response.body.user).toHaveProperty('email', mockUser.email);
    });

    it('should return error if no token provided', async () => {
      const response = await request(app)
        .get('/api/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'No token, authorization denied');
    });

    it('should return error if token is invalid', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('x-auth-token', 'invalid_token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Token is not valid');
    });
  });
}); 