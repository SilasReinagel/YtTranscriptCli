// @ts-check
import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cookiesPath = path.join(__dirname, 'cookies.json');

if (!fs.existsSync(cookiesPath)) {
  throw new Error('cookies.json file not found. Please ensure it exists in the same directory as this script.');
}

const cookiesJson = JSON.parse(fs.readFileSync('./cookies.json', 'utf8'));
const agent = ytdl.createAgent(cookiesJson);

/**
 * Download YouTube video
 * @param {string} url
 * @param {string} outputPath
 * @returns {Promise<void>}
 */
export async function downloadVideo(url, outputPath) {
  return new Promise((resolve, reject) => {
    const ytdlStream = ytdl(url, { quality: 'highestaudio', agent });
    const writeStream = fs.createWriteStream(outputPath);

    ytdlStream.pipe(writeStream);

    ytdlStream.on('progress', (chunkLength, downloaded, total) => {
      const percent = (downloaded / total * 100).toFixed(2);
      console.log(`Downloading: ${percent}% of ${(total / 1024 / 1024).toFixed(2)} MB`);
    });

    ytdlStream.on('error', (error) => {
      console.error('Error in ytdl stream:', error);
      reject(error);
    });

    writeStream.on('finish', () => {
      console.log('Download stream finished');
      resolve();
    });

    writeStream.on('error', (error) => {
      console.error('Error in write stream:', error);
      reject(error);
    });

    writeStream.on('close', () => {
      console.log('Download stream closed');
    });
  });
}

/**
 * Get video ID and info
 * @param {string} url
 * @returns {Promise<{videoId: string, videoInfo: ytdl.videoInfo}>}
 */
export async function getVideoInfo(url) {
  const videoId = ytdl.getVideoID(url);
  const videoInfo = await ytdl.getInfo(url, { agent });
  return { videoId, videoInfo };
}