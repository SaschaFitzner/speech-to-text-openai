require('dotenv').config();

const express = require("express");
const multer = require("multer");
const fsPromises = require("fs").promises; // For async file operations
const fs = require("fs");
const { exec } = require("child_process");
const { Configuration, OpenAIApi } = require("openai");
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');

const uuidv4 = require('uuid').v4; // Import UUID library to generate unique IDs

// Read data from .env file
let apiKey = process.env.OPENAI_KEY;
const deploy_env = process.env.DEPLOY_ENV || 'local';
const username = process.env.BASIC_AUTH_USERNAME;
const password = process.env.BASIC_AUTH_PASSWORD;

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

// Basic Authentication
if (deploy_env !== 'local') {
  app.use(basicAuth({
      users: { [username]: password },
      challenge: true,
      realm: 'Transcriber',
  }));
}


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
  const audioFilename = `files/${uuidv4()}.wav`;

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

    // Delete the audio file after processing
    fsPromises.unlink(audioFilename).catch((err) => {
        console.error("Error deleting file:", err);
    });

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

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
  exec('start "" /b http://localhost:3000');
});
