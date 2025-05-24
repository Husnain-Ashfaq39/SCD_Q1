const Comment = require('../models/Comment');
const axios = require('axios');

// Get all comments for a blog
exports.getCommentsByBlogId = async (req, res) => {
  try {
    const comments = await Comment.find({ blogId: req.params.blogId }).sort({ createdAt: -1 });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new comment
exports.createComment = async (req, res) => {
  try {
    const { content, blogId } = req.body;
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
      
      // Verify that the blog exists
      try {
        await axios.get(`${process.env.BLOG_SERVICE_URL}/api/blogs/${blogId}`);
      } catch (error) {
        return res.status(404).json({ message: 'Blog not found' });
      }
      
      const newComment = new Comment({
        content,
        blogId,
        userId: user.id,
        author: user.username
      });
      
      const savedComment = await newComment.save();
      res.status(201).json(savedComment);
    } catch (error) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update comment
exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;
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
      
      // Find the comment
      const comment = await Comment.findById(req.params.id);
      
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      // Check if the user is the author
      if (comment.userId !== user.id) {
        return res.status(403).json({ message: 'User not authorized to update this comment' });
      }
      
      // Update the comment
      comment.content = content;
      
      const updatedComment = await comment.save();
      res.status(200).json(updatedComment);
    } catch (error) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
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
      
      // Find the comment
      const comment = await Comment.findById(req.params.id);
      
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      // Check if the user is the author
      if (comment.userId !== user.id) {
        return res.status(403).json({ message: 'User not authorized to delete this comment' });
      }
      
      await Comment.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete all comments for a blog (used when a blog is deleted)
exports.deleteCommentsByBlogId = async (req, res) => {
  try {
    await Comment.deleteMany({ blogId: req.params.blogId });
    res.status(200).json({ message: 'Comments deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 