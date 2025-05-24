const express = require('express');
const {
  getCommentsByBlogId,
  createComment,
  updateComment,
  deleteComment,
  deleteCommentsByBlogId
} = require('../controllers/commentController');
const router = express.Router();

router.get('/blog/:blogId', getCommentsByBlogId);
router.post('/', createComment);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);
router.delete('/blog/:blogId', deleteCommentsByBlogId);

module.exports = router; 