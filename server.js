// server.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { exec, spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");
const app = express();
const PORT = 3000;

// Add these lines:
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Multer setup to store files in a temporary UUID-based directory
const TEMP_ROOT = "/tmp";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!req.tempDir) {
      req.tempDir = path.join(TEMP_ROOT, uuidv4());
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

app.get("/test", (req, res) => {
  res.send("Hello from Node!");
});
app.get("/getTest", (req, res) => {
  res.send("Hello from Node!");
});
app.post(
  "/convert",
  upload.fields([
    { name: "images", maxCount: 100 },
    { name: "audio", maxCount: 1 },
    // { name: "subtitles", maxCount: 1 },
  ]),
  (req, res) => {
    const files = req.files;
    const dir = "/tmp"; // Use the tempDir created by multer storage

    if (!files || !files.images || !files.audio) {
      return res.status(400).send("Images and audio are required.");
    }

    const outputPath = path.join(dir, "output.mp4");
    console.log("outputPath", outputPath);

    // FFmpeg command, same as before
    const command = `ffmpeg -y -framerate 0.2 -i "${dir}/frame%d.png" -i "${dir}/audio.mp3" -c:v libx264 -r 30 -pix_fmt yuv420p -c:a aac -shortest "${outputPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("FFmpeg Error:", stderr);
        // Cleanup before sending error
        try {
          fs.rmSync(dir, { recursive: true, force: true });
        } catch (_) {}
        return res.status(500).send(`FFmpeg processing failed:\n${stderr}`);
      }

      res.download(outputPath, "output.mp4", (err) => {
        // Cleanup after sending file
        try {
          fs.rmSync(dir, { recursive: true, force: true });
        } catch (_) {}
        if (err) {
          console.error("Error sending file:", err);
        }
      });
    });
  }
);
app.post("/download", async (req, res) => {
  try {
    const videoUrl = req.body.video_url;

    if (!videoUrl) {
      return res.status(400).json({ error: "Missing video_url in body" });
    }

    // Use a unique temp directory
    const tempDir = path.join("/tmp", "downloads", uuidv4());
    fs.mkdirSync(tempDir, { recursive: true });
    const outputFile = path.join(tempDir, "audio.mp3");

    const ytdlp = spawn("yt-dlp", [
      "-x",
      "--audio-format",
      "mp3",
      "-o",
      `${tempDir}/audio.%(ext)s`,
      videoUrl,
    ]);

    ytdlp.stderr.on("data", (data) => {
      console.error(`yt-dlp stderr: ${data}`);
    });

    ytdlp.on("error", (err) => {
      console.error("yt-dlp failed to start:", err);
      return res.status(500).json({ error: "yt-dlp process failed to start" });
    });

    ytdlp.on("close", (code) => {
      if (code !== 0) {
        return res
          .status(500)
          .json({ error: "yt-dlp failed to download audio" });
      }

      fs.readFile(outputFile, (err, data) => {
        if (err) {
          console.error("Failed to read the audio file:", err);
          return res.status(500).send("Failed to read audio file");
        }

        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Content-Disposition", "attachment; filename=audio.mp3");
        res.send(data);

        // Clean up
        fs.rm(tempDir, { recursive: true, force: true }, (cleanupErr) => {
          if (cleanupErr) {
            console.error("Cleanup error:", cleanupErr);
          }
        });
      });
    });
  } catch (e) {
    console.error("Unexpected server error:", e);
    return res.status(500).json({ error: "Unexpected server error" });
  }
});

app.post("/postTest", (req, res) => {
  console.log("dgdfgd");
  return res;
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
