#!/usr/bin/env node
// @ts-check

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';
import ffmpeg from 'fluent-ffmpeg';
import pkg from '@deepgram/sdk';
import { downloadVideo, getVideoInfo } from './ytdlClient.js';

const { Deepgram } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure required directories exist
const createDirIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

createDirIfNotExists(path.join(__dirname, '_downloads'));
createDirIfNotExists(path.join(__dirname, '_audio_extracts'));
createDirIfNotExists(path.join(__dirname, '_transcriptions'));

// Validate environment variables
if (!process.env.DEEPGRAM_API_KEY) {
  console.error('ATTN: DEEPGRAM_API_KEY environment variable is not set');
  process.exit(1);
}

const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

/**
 * Extract audio from video
 * @param {string} inputPath
 * @param {string} outputPath
 * @returns {Promise<void>}
 */
async function extractAudio(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions('-vn')
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .save(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });
}

/**
 * Transcribe audio using Deepgram
 * @param {string} audioPath
 * @returns {Promise<string>}
 */
async function transcribeAudio(audioPath) {
  const audio = fs.readFileSync(audioPath);
  const source = { buffer: audio, mimetype: 'audio/mp3' };
  const response = await deepgram.transcription.preRecorded(source, {
    smart_format: true,
    punctuate: true,
  });
  console.log('Transcription Response', response)
  return response?.results?.channels[0]?.alternatives?.[0]?.transcript || '';
}

/**
 * Main function to process YouTube video
 * @param {string} url
 * @returns {Promise<void>}
 */
async function processYouTubeVideo(url) {
  try {
    const { videoId, videoInfo } = await getVideoInfo(url);
    const videoTitle = videoInfo.videoDetails.title.replace(/[^\w\s]/gi, '');

    const videoPath = path.join(__dirname, '_downloads', `${videoId}.mp4`);
    const audioPath = path.join(__dirname, '_audio_extracts', `${videoId}.mp3`);
    const transcriptionPath = path.join(__dirname, '_transcriptions', `${videoId}.txt`);

    if (!fs.existsSync(videoPath)) {
      console.log('Downloading video...');
      await downloadVideo(url, videoPath);
      console.log('Video downloaded successfully!');
    } else {
      console.log('Video already exists, skipping download.');
    }

    if (!fs.existsSync(audioPath)) {
      console.log('Extracting audio...');
      await extractAudio(videoPath, audioPath);
      console.log('Audio extracted successfully!');
    } else {
      console.log('Audio already exists, skipping extraction.');
    }

    if (!fs.existsSync(transcriptionPath)) {
      console.log('Transcribing audio...');
      const transcription = await transcribeAudio(audioPath);
      console.log('Audio transcribed successfully!');
      console.log('Writing transcription...');
      fs.writeFileSync(transcriptionPath, transcription);
    } else {
      console.log('Transcription already exists, skipping transcription.');
    }

    console.log('Process completed successfully!');
  } catch (error) {
    console.error('An error occurred:', error.message);
    throw error; // Re-throw the error to be caught by the main process
  }
}

// Set up CLI
program
  .version('1.0.0')
  .description('YouTube Video Transcriber')
  .argument('<url>', 'YouTube video URL')
  .action(async (url) => {
    try {
      await processYouTubeVideo(url);
      process.exit(0);
    } catch (error) {
      console.error('Failed to process video:', error);
      process.exit(1);
    }
  });

program.parse(process.argv);