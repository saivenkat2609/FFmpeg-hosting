// server.js
const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");

const app = express();
app.use(bodyParser.json());

app.post("/api/render", (req, res) => {
  const { imagePattern, audioPath, subtitlePath, outputPath } = req.body;

  if (!imagePattern || !audioPath || !subtitlePath || !outputPath) {
    return res
      .status(400)
      .json({ error: "Missing required paths in request body." });
  }

  const ffmpegCmd = `ffmpeg -y -framerate 0.2 -i ${imagePattern} -i ${audioPath} -vf "subtitles=${subtitlePath}" -c:v libx264 -r 30 -pix_fmt yuv420p -c:a aac -shortest ${outputPath}`;

  exec(ffmpegCmd, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr);
      return res
        .status(500)
        .json({ error: "FFmpeg execution failed.", details: stderr });
    }
    res.json({ message: "Video created successfully", output: outputPath });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FFmpeg server running on port ${PORT}`));
