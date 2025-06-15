const express = require("express");
const router = express.Router();
const Post = require("../modules/postes");
const Comment = require("../modules/comment");
const auth = require("../middleware/auth");
const fs = require("fs");
const path = require("path");
const upload = require("../utils/Upload");
const uploadToImageKit = require("../utils/UploadImg");

async function attachComments(post) {
  const comments = await Comment.find({ postId: post._id })
    .populate("userId", "username profilePicture")
    .sort({ createdAt: -1 });
  return { ...post.toObject(), comments };
}

// Get all posts with comments
router.get("/allPosts", async (req, res) => {
  try {
    const posts = await Post.find()
       .populate("authorId", "username _id profilePicture") 
      .sort({ createdAt: -1 }); 

    const postsWithComments = await Promise.all(posts.map(attachComments));

    res.json(postsWithComments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Pagination with comments
router.get("/paginationPost", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("authorId", "username profilePicture");

    const totalPosts = await Post.countDocuments();
    const postsWithComments = await Promise.all(posts.map(attachComments));

    res.json({
      posts: postsWithComments,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Search posts with comments
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ message: "Query parameter is required" });

    const posts = await Post.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    }).populate("authorId", "username email");

    const postsWithComments = await Promise.all(posts.map(attachComments));
    res.json(postsWithComments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single post with comments
router.get("/singlePost/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("authorId", "username email");
    if (!post) return res.status(404).json({ message: "Post not found" });

    const fullPost = await attachComments(post);
    res.json(fullPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new post
router.post("/createPost", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const authorId = req.user.id;

    let imageUrl;
    if (req.file) {
      const base64Image = req.file.buffer.toString("base64");
      imageUrl = await uploadToImageKit(
        `data:${req.file.mimetype};base64,${base64Image}`,
        `post_${Date.now()}`
      );
    }

    const post = await Post.create({
      title,
      description,
      image: imageUrl,
      authorId,
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(400).json({ message: err.message || "Failed to upload image" });
  }
});

// Update a post
router.put("/updatePost/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to edit this post" });
    }

    const { title, description } = req.body;
    if (title) post.title = title;
    if (description) post.description = description;

    if (req.file) {
      const base64Image = req.file.buffer.toString("base64");
      const imageUrl = await uploadToImageKit(
        `data:${req.file.mimetype};base64,${base64Image}`,
        `post_${Date.now()}`
      );
      post.image = imageUrl;
    }

    await post.save();

  const updatedPost = await Post.findById(post._id).populate("authorId", "username email profilePicture");

    res.json(updatedPost);
  } catch (err) {
    console.error("Update error:", err.message);
    res.status(400).json({ message: err.message });
  }
});

// Like a post
router.put("/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.likes.includes(req.user.id)) {
      return res.status(400).json({ message: "You already liked this post" });
    }

    post.likes.push(req.user.id);
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("authorId", "username profilePicture") 
      .populate("comments.userId", "username profilePicture"); 

    res.json(updatedPost); 
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// Unlike a post
router.put("/:id/unlike", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (!post.likes.includes(req.user.id)) {
      return res.status(400).json({ message: "You haven't liked this post" });
    }

    post.likes = post.likes.filter(
      (userId) => userId.toString() !== req.user.id
    );
    await post.save();

   
    const updatedPost = await Post.findById(post._id)
      .populate("authorId", "username profilePicture") 
      .populate("comments.userId", "username profilePicture"); 

    res.json(updatedPost); 
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// Delete a post
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to delete this post" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get posts by specific user + comments
router.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ authorId: req.params.userId })
      .populate("authorId", "username profilePicture"); 

    const postsWithComments = await Promise.all(posts.map(attachComments));
    res.status(200).json(postsWithComments);
  } catch (err) {
    console.error("Error fetching posts by user:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
