// server.js
const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/api/render', upload.fields([
  { name: 'images', maxCount: 100 },
  { name: 'audio', maxCount: 1 },
  { name: 'subtitles', maxCount: 1 }
]), (req, res) => {
  const images = req.files['images'];
  const audio = req.files['audio']?.[0];
  const subtitles = req.files['subtitles']?.[0];

  if (!images || !audio || !subtitles) {
    return res.status(400).json({ error: 'Missing images, audio, or subtitles.' });
  }

  // Sort image files by filename
  const sortedImages = images.sort((a, b) => a.originalname.localeCompare(b.originalname));
  const imageListPath = 'uploads/image_list.txt';
  const outputPath = `uploads/output_${Date.now()}.mp4`;

  // Create an image list file for ffmpeg
  const imageList = sortedImages.map(file => `file '${file.path}'\nduration 5`).join('\n');
  fs.writeFileSync(imageListPath, imageList);

  const ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i ${imageListPath} -i ${audio.path} -vf subtitles=${subtitles.path} -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest ${outputPath}`;

  exec(ffmpegCmd, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr);
      return res.status(500).json({ error: 'FFmpeg failed', details: stderr });
    }
    res.download(outputPath);
  });
});

app.listen(3000, () => {
  console.log('FFmpeg API server listening on port 3000');
});
