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
const http = require("https");
const axios = require("axios");
const stream = require("stream");
// Add these lines:
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json({ limit: '100mb' })); // Handle large base64 audio & subtitle input

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
  let fileUrl;
  const options = {
    method: "GET",
    url: "https://youtube-mp36.p.rapidapi.com/dl",
    params: { id: "UxxajLWwzqY" },
    headers: {
      "x-rapidapi-key": "364b17fb2fmsheca1db02dc1b4ddp19f21fjsn9a4a1ee0f944",
      "x-rapidapi-host": "youtube-mp36.p.rapidapi.com",
    },
  };

  async function fetchData() {
    try {
      const response = await axios.request(options);
      fileUrl = response.data.link;
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  await fetchData();
  const response = await axios.get(fileUrl, {
    responseType: "arraybuffer",
  });

  const mimeType = response.headers["content-type"] || "audio/mpeg";
  const base64Audio = Buffer.from(response.data, "binary").toString("base64");

  // Create a data URI (optional)
  const dataUri = `data:${mimeType};base64,${base64Audio}`;

  res.json({
    mimeType,
    base64: base64Audio,
    dataUri, // optional: useful if you want to use it in an <audio> tag
  });
  return res;
});

app.post('/create-video', async (req, res) => {
  try {
    const { audio, subtitles } = req.body;

    if (!audio || !subtitles) {
      return res.status(400).json({ error: 'Missing audio or subtitles' });
    }

    // Save audio to file
    const audioPath = `uploads/audio_${Date.now()}.mp3`;
    const audioBuffer = Buffer.from(audio, 'base64');
    fs.writeFileSync(audioPath, audioBuffer);

    // Save subtitles to .srt file
    const subtitlePath = `uploads/subs_${Date.now()}.srt`;
    fs.writeFileSync(subtitlePath, subtitles.replace(/\\n/g, '\n'));

    // Define output path
    const outputPath = `uploads/output_${Date.now()}.mp4`;

    // Use FFmpeg to generate video
    ffmpeg()
      .input('color=black:s=1280x720:d=600') // Adjust d=600 or use -shortest to clip to audio length
      .inputFormat('lavfi')
      .input(audioPath)
      .input(subtitlePath)
      .complexFilter([
        {
          filter: 'subtitles',
          options: subtitlePath,
        },
      ])
      .outputOptions('-shortest') // Trim video to shortest input
      .output(outputPath)
      .on('end', () => {
        const videoBuffer = fs.readFileSync(outputPath);
        const videoBase64 = videoBuffer.toString('base64');

        // Clean up
        fs.unlinkSync(audioPath);
        fs.unlinkSync(subtitlePath);
        fs.unlinkSync(outputPath);

        res.json({ video: videoBase64 });
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        res.status(500).json({ error: 'Video creation failed' });
      })
      .run();
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
