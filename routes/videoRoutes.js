const express = require("express");
const multer = require("multer");
const Video = require("../models/Video");
const { verifyToken, isAdmin } = require("../middleware/auth");

const router = express.Router();

// MULTER
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });



    // 🔥 SAFETY CHECK
    router.post(
  "/upload",
  verifyToken,
  isAdmin,
  upload.single("video"),
  async (req, res) => {

    // 👇 ADD HERE
    console.log("FILE:", req.file);
    console.log("BODY:", req.body);

    if (!req.file) {
      return res.status(400).send("❌ No file uploaded");
    }

    const video = new Video({
      title: req.body.title,
      videoUrl: `/uploads/${req.file.filename}`
    });

    await video.save();

    res.send("✅ Uploaded");
  }
);

// GET
router.get("/videos", async (req, res) => {
  const videos = await Video.find();
  res.json(videos);
});

// DELETE
router.delete("/delete/:id", verifyToken, isAdmin, async (req, res) => {
  await Video.findByIdAndDelete(req.params.id);
  res.send("Deleted");
});

// UPDATE
router.put("/update/:id", verifyToken, isAdmin, async (req, res) => {
  await Video.findByIdAndUpdate(req.params.id, {
    title: req.body.title
  });

  res.send("Updated");
});

module.exports = router;