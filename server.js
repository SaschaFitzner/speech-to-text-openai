const express = require('express');
const multer = require('multer');
const fsPromises = require('fs').promises;  // Für Promise-basierte Funktionen
const fs = require('fs');  // Für andere Funktionen
const { exec } = require('child_process'); // Für den Aufruf von Kommandozeilenbefehlen
const { Configuration, OpenAIApi } = require("openai");

// Lese den API-Schlüssel aus der credentials.json-Datei
require('dotenv').config();
const apiKey = process.env.OPENAI_KEY;

const configuration = new Configuration({
    apiKey: apiKey,
});
const openai = new OpenAIApi(configuration);

const app = express();

// Serve static files from the "public" directory
app.use(express.static('public'));

const storage = multer.memoryStorage()
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
        // At this point, you can decide what should happen when an error occurs.
        // For example, you could rethrow the error to be handled by the calling function, or return null.
        throw error; // Or: return null;
    }
}


app.post('/transcribe', upload.single('audio'), async (req, res) => {
    const audioFilename = 'files/audio.wav';
    fsPromises.writeFile(audioFilename, req.file.buffer)
    .then(async () => {
        const transcription = await transcribeAudio(audioFilename);
        res.send(transcription);  // Sendet die Transkription zurück an den Client.
    })
    .catch(err => {
        console.error('Error writing file:', err);
        res.status(500).send('Server error');
    });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
    exec('start "" /b http://localhost:3000');
});