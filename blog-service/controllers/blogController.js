const Blog = require('../models/Blog');
const axios = require('axios');

// Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get blog by ID
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new blog
exports.createBlog = async (req, res) => {
  try {
    const { title, content } = req.body;
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify the token with auth service
    try {
      const authResponse = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/verify`, {
        headers: { 'x-auth-token': token }
      });
      
      const { user } = authResponse.data;
      
      const newBlog = new Blog({
        title,
        content,
        userId: user.id,
        author: user.username
      });
      
      const savedBlog = await newBlog.save();
      res.status(201).json(savedBlog);
    } catch (error) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update blog
exports.updateBlog = async (req, res) => {
  try {
    const { title, content } = req.body;
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify the token with auth service
    try {
      const authResponse = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/verify`, {
        headers: { 'x-auth-token': token }
      });
      
      const { user } = authResponse.data;
      
      // Find the blog
      const blog = await Blog.findById(req.params.id);
      
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }
      
      // Check if the user is the author
      if (blog.userId !== user.id) {
        return res.status(403).json({ message: 'User not authorized to update this blog' });
      }
      
      // Update the blog
      blog.title = title || blog.title;
      blog.content = content || blog.content;
      
      const updatedBlog = await blog.save();
      res.status(200).json(updatedBlog);
    } catch (error) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify the token with auth service
    try {
      const authResponse = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/verify`, {
        headers: { 'x-auth-token': token }
      });
      
      const { user } = authResponse.data;
      
      // Find the blog
      const blog = await Blog.findById(req.params.id);
      
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }
      
      // Check if the user is the author
      if (blog.userId !== user.id) {
        return res.status(403).json({ message: 'User not authorized to delete this blog' });
      }
      
      await Blog.findByIdAndDelete(req.params.id);
      
      // Notify comment service about blog deletion (optional)
      try {
        await axios.delete(`${process.env.COMMENT_SERVICE_URL}/api/comments/blog/${req.params.id}`);
      } catch (error) {
        // Just log the error but don't stop the response
        console.log('Error notifying comment service:', error.message);
      }
      
      res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 