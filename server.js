require('dotenv').config();

const express = require("express");
const multer = require("multer");
const fsPromises = require("fs").promises; // For async file operations
const fs = require("fs");
const { exec } = require("child_process");
const { Configuration, OpenAIApi } = require("openai");
const bodyParser = require('body-parser');

// Read OpenAI key from .env file
let apiKey = process.env.OPENAI_KEY; 

let openai;

function updateOpenAIConfiguration(key) {
  const configuration = new Configuration({
    apiKey: key,
  });
  openai = new OpenAIApi(configuration);
}

// Initialize OpenAI API
updateOpenAIConfiguration(apiKey);

const app = express();

// Parse JSON request body
app.use(bodyParser.json());

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

app.get("/checkEnv", async (req, res) => {
  try {
      await fsPromises.access('.env');
      res.sendStatus(200); // File exist, send status code 200
  } catch (error) {
      res.sendStatus(404); // File not found, send status code 404
  }
});

app.post("/setOpenAIKey", async (req, res) => {
  apiKey = req.body.key; // Store the key in a variable
  updateOpenAIConfiguration(apiKey);
  try {
      await fsPromises.writeFile('.env', `OPENAI_KEY=${apiKey}`);
      res.sendStatus(200); // Success, send status code 200
  } catch (error) {
      res.sendStatus(500); // Error, send status code 500
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
  exec('start "" /b http://localhost:3000');
});
