const express = require("express");
const router = express.Router();
const Comment = require("../modules/comment"); 
const Post = require("../modules/postes");
const auth = require("../middleware/auth");

const attachComments = async (post) => {
  const comments = await Comment.find({ postId: post._id })
    .populate("userId", "username")
    .sort({ createdAt: -1 });

  return { ...post.toObject(), comments };
};

// Add comment
router.post('/add/:postId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.postId;

    const comment = new Comment({
      text,
      userId: req.user.id,
      postId,
    });

    await comment.save();
  const populatedComment = await Comment.findById(comment._id).populate('userId', 'username profilePicture');


    res.json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

//delete comment
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    const deletedComment = await Comment.findByIdAndDelete(req.params.id);
    if (!deletedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;