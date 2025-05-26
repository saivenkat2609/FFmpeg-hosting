const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/create-video', upload.array('images'), async (req, res) => {
  try {
    const imageFiles = req.files;
    const outputPath = `output_${Date.now()}.mp4`;
    const tempDir = `uploads/${Date.now()}`;
    fs.mkdirSync(tempDir);

    // Rename files to consistent names
    imageFiles.forEach((file, index) => {
      const newPath = `${tempDir}/img${String(index).padStart(3, '0')}.jpg`;
      fs.renameSync(file.path, newPath);
    });

    // FFmpeg command to create video
    const command = `ffmpeg -framerate 1 -i ${tempDir}/img%03d.jpg -c:v libx264 -r 30 -pix_fmt yuv420p ${outputPath}`;

    exec(command, (error) => {
      if (error) {
        console.error(error);
        return res.status(500).send('FFmpeg error');
      }

      res.download(outputPath, () => {
        // Clean up
        fs.rmSync(tempDir, { recursive: true, force: true });
        fs.unlinkSync(outputPath);
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
