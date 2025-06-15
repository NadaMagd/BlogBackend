const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../modules/user");
const auth = require("../middleware/auth");
const upload = require("../utils/Upload"); // Multer config
const uploadImage = require("../utils/UploadImg"); // Upload to imgkit

// ========== Registration ==========
router.post(
  "/register",
  [
    body("username").notEmpty().withMessage("username is required"),
    body("email").isEmail().withMessage("Invalid email format"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: "Email already in use" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username, email, password: hashedPassword });
      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      res.status(201).json({ message: "User registered successfully", token });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ========== Login ==========
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ========== Get Own Profile ==========
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========== Update Own Profile ==========
router.put("/UpdateProfile", auth, async (req, res) => {
  try {
    const allowedUpdates = ["username", "email", "bio"];
    const updates = {};

    allowedUpdates.forEach((key) => {
      if (req.body[key]) updates[key] = req.body[key];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select("-password");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ========== Update Profile Picture ==========
router.put("/profilePicture", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Image file is required" });
    console.log(process.env.IMAGEKIT_PUBLIC_KEY);
console.log(process.env.IMAGEKIT_PRIVATE_KEY);
console.log(process.env.IMAGEKIT_URL_ENDPOINT);


    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const imageUrl = await uploadImage(base64Image); // ارفع الصورة لـ imgkit أو أي خدمة

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: imageUrl },
      { new: true }
    ).select("-password");

    return res.json({ message: "Profile picture updated", profilePicture: imageUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(400).json({ message: err.message });
  }
});


// ========== Get All Users ==========
router.get("/", auth, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========== Get User By ID ==========
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========== Update User By ID ==========
router.put("/update/:id", auth, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const allowedUpdates = ["username", "email"];
    const updates = {};
    allowedUpdates.forEach((key) => {
      if (req.body[key]) updates[key] = req.body[key];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ========== Delete User ==========
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
