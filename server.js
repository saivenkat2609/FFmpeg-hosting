// server.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;

// Multer setup to store files in a temporary UUID-based directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!req.tempDir) {
      req.tempDir = path.join(__dirname, "uploads", uuidv4());
      fs.mkdirSync(req.tempDir, { recursive: true });
    }
    cb(null, req.tempDir);
  },
  filename: (req, file, cb) => {
    if (file.fieldname === "images") {
      const idx = (req.imageIndex = req.imageIndex || 1);
      cb(null, `frame${idx}.png`);
      req.imageIndex++;
    } else if (file.fieldname === "audio") {
      cb(null, "audio.mp3");
    } else if (file.fieldname === "subtitles") {
      cb(null, "subtitles.srt");
    }
  },
});

const upload = multer({ storage });

app.post(
  "/convert",
  upload.fields([
    { name: "images", maxCount: 100 },
    { name: "audio", maxCount: 1 },
    { name: "subtitles", maxCount: 1 },
  ]),
  (req, res) => {
    const dir = req.tempDir;
    const outputPath = path.join(dir, "output.mp4");

    const command = `ffmpeg -y -framerate 0.2 -i ${dir}/frame%d.png -i ${dir}/audio.mp3 -vf "subtitles=${dir}/subtitles.srt" -c:v libx264 -r 30 -pix_fmt yuv420p -c:a aac -shortest ${outputPath}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("FFmpeg Error:", stderr);
        return res.status(500).send("FFmpeg processing failed.");
      }

      res.download(outputPath, "output.mp4", (err) => {
        fs.rmSync(dir, { recursive: true, force: true }); // Clean up
      });
    });
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
