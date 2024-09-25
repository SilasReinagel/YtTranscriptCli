# YouTube Video Transcriber

This is a Node.js CLI application that downloads YouTube videos, extracts the audio, and transcribes it using Deepgram.

## Prerequisites

- Node.js (v14 or later)
- ffmpeg installed on your system
- Deepgram API key

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Set the `DEEPGRAM_API_KEY` environment variable with your Deepgram API key

## Usage

1. Run `node index.js <url>` to start the application
2. The application will download the video, extract the audio, and transcribe it
3. The transcription will be saved to a file

## License
