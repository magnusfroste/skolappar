// The starter template and the agent skills: plain files under server/content/, read once at
// start and served over HTTP (/starter/, /skills/) and over MCP (get_starter, list_skills, get_skill).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), 'content');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
};
const BINARY = new Set(['.mp3']);

/** Every file under dir (one level of folders, e.g. ljud/), path relative to dir; recordings as Buffers. */
function readDir(dir, prefix = '') {
  return readdirSync(dir).sort().flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return prefix ? [] : readDir(full, `${name}/`);
    const ext = extname(name);
    return [{ path: prefix + name, type: TYPES[ext] || 'text/plain; charset=utf-8', binary: BINARY.has(ext),
      content: BINARY.has(ext) ? readFileSync(full) : readFileSync(full, 'utf8') }];
  });
}

/** name and description from the front matter of a SKILL.md. */
function frontMatter(text) {
  const block = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] || '';
  const field = (key) => new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(block)?.[1].trim() || '';
  return { name: field('name'), description: field('description') };
}

export function loadContent() {
  const starter = readDir(join(root, 'starter'));
  const skills = readdirSync(join(root, 'skills')).sort().map((dir) => {
    const text = readFileSync(join(root, 'skills', dir, 'SKILL.md'), 'utf8');
    return { ...frontMatter(text), dir, content: text };
  });
  return {
    starter,
    kotten: readFileSync(join(root, 'kotten.js'), 'utf8'),
    starterFile: (path) => starter.find((f) => f.path === path) || null,
    skills,
    skill: (name) => skills.find((s) => s.name === name) || null,
  };
}
