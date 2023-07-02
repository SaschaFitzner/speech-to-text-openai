# Audio Recorder / Transcriber

**Author Sascha Fitzner - fitznerIO**

Welcome to audio recoder / transcriber! This application allows you to record audio and transcribe it using OpenAI Text. 
The transcribed result will be automatically copied to the clipboard.

## Installation
To set up the project locally, follow these steps:

- Clone the repository: `git clone https://github.com/SaschaFitzner/speech-to-text-openai`
- Navigate to the project directory: `cd speech-to-text-openai`
- Rename the env.template file to .env.
- Open the .env file and provide your OpenAI API key: `OPENAI_KEY=your-api-key`
- Install the dependencies: `npm install`

## Usage
To start the application, use the following command:

`npm start`

This will start the application on localhost:3000, and you can begin recording audio. The transcribed result will be automatically copied to the clipboard.

Additionally, you can use the command `npm run build` to trigger a build of the application using pkg. The built image will be saved in the dist folder.

## Contributing
If you would like to contribute to the development of this project, feel free to create a pull request or open an issue. Your contributions are welcome!

## License
This project is licensed under the MIT License. See the LICENSE file for details.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)