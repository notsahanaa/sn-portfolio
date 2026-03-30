import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '../data/content.json');

export async function readData() {
  const content = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(content);
}

export async function writeData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

export function getVisibleProjects(data) {
  return data.buildInPublic.projects.filter(p => p.visible);
}

export function findProjectBySlug(data, slug) {
  return data.buildInPublic.projects.find(p => p.slug === slug);
}

export function findProjectById(data, id) {
  return data.buildInPublic.projects.find(p => p.id === id);
}
