const express = require("express");
const multer = require("multer");
const fsPromises = require("fs").promises; // For async file operations
const fs = require("fs");
const { exec } = require("child_process");
const { Configuration, OpenAIApi } = require("openai");

// Lese den API-Schlüssel aus der credentials.json-Datei
require("dotenv").config();
const apiKey = process.env.OPENAI_KEY;

const configuration = new Configuration({
  apiKey: apiKey,
});
const openai = new OpenAIApi(configuration);

const app = express();

// Serve static files from the "public" directory
app.use(express.static("public"));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function transcribeAudio(filename) {
  try {
    const transcript = await openai.createTranscription(
      fs.createReadStream(filename),
      "whisper-1"
    );
    return transcript.data.text;
  } catch (error) {
    console.error(`Error while transcribing audio file: ${error.message}`);
    throw error;
  }
}

async function translateAudio(filename) {
  try {
    const transcript = await openai.createTranslation(
      fs.createReadStream(filename),
      "whisper-1"
    );
    return transcript.data.text;
  } catch (error) {
    console.error(`Error while transcribing audio file: ${error.message}`);
    throw error;
  }
}

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  const audioFilename = "files/audio.wav";

  fsPromises
    .writeFile(audioFilename, req.file.buffer)
    .then(async () => {
      let responseText;
      const translate = req.body.translate;

      if (translate === "true") {
        try {
          responseText = await translateAudio(audioFilename);
        } catch (error) {
          console.error("Error translating text:", error);
          // In case of translation error, you can choose to use the original transcription or return an error message
          responseText = "Translation failed";
        }
      } else {
        responseText = await transcribeAudio(audioFilename);
      }

      res.send(responseText); // Send the response text back to the client
    })
    .catch((err) => {
      console.error("Error writing file:", err);
      res.status(500).send("Server error");
    });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
  exec('start "" /b http://localhost:3000');
});
