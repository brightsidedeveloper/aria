import fs from 'fs';
import simpleGit from 'simple-git';
import path from 'path';

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const git = simpleGit();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

interface BroadcastPayload {
  event: string;
  type: string;
  payload: Payload;
}

interface Payload {
  code?: string;
  path: string;
}

const handleCreateFile = async ({ payload: { code, path: filePath } }: BroadcastPayload) => {
  if (!code || !filePath) return console.log('Invalid payload');

  const finalPath = path.join(__dirname, filePath);
  fs.writeFileSync(finalPath, code, 'utf8');

  try {
    await git.add(finalPath);
    await git.commit('Add generated file');
    await git.push('origin', 'main'); // Ensure 'main' is the correct branch
    console.log('File pushed to GitHub successfully!');
  } catch (error) {
    console.error('Failed to push file to GitHub:', error);
  }
};

const handleDeleteFile = async ({ payload: { path: filePath } }: BroadcastPayload) => {
  if (!filePath) return console.log('Invalid payload');

  const finalPath = path.join(__dirname, filePath);
  if (fs.existsSync(finalPath)) {
    fs.unlinkSync(finalPath);

    try {
      await git.rm(finalPath);
      await git.commit('Delete file');
      await git.push('origin', 'main'); // Ensure 'main' is the correct branch
      console.log('File deleted and pushed to GitHub successfully!');
    } catch (error) {
      console.error('Failed to push file deletion to GitHub:', error);
    }
  } else {
    console.log('File does not exist:', finalPath);
  }
};

const handlePushFile = async ({ payload: { path: filePath } }: BroadcastPayload) => {
  if (!filePath) return console.log('Invalid payload');

  const finalPath = path.join(__dirname, filePath);
  try {
    await git.add(finalPath);
    await git.commit('Update file');
    await git.push('origin', 'main'); // Ensure 'main' is the correct branch
    console.log('File updated and pushed to GitHub successfully!');
  } catch (error) {
    console.error('Failed to push file update to GitHub:', error);
  }
};

const channel = supabase.channel('aria');

channel.on('broadcast', { event: 'create-file' }, handleCreateFile).subscribe();
channel.on('broadcast', { event: 'delete-file' }, handleDeleteFile).subscribe();
channel.on('broadcast', { event: 'push-file' }, handlePushFile).subscribe();

process.stdin.resume(); // Keep process alive
