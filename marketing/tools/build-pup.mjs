/**
 * Bundle the Sunny studio into one self-contained HTML file.
 *
 * Usage: node marketing/tools/build-pup.mjs
 *
 * Source lives in studio/pup/{shell.html,src/*}. Output is studio/pup/index.html,
 * which opens from file:// with zero network access.
 */
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const SRC = path.join(ROOT, 'studio/pup');

const result = await build({
  entryPoints: [path.join(SRC, 'src/app.js')],
  bundle: true,
  format: 'iife',
  target: ['chrome110', 'safari16'],
  minify: true,
  write: false,
  legalComments: 'inline',
  nodePaths: [path.join(HERE, 'node_modules')],
  absWorkingDir: HERE,
});

const bundle = result.outputFiles[0].text;
const template = readFileSync(path.join(SRC, 'shell.html'), 'utf8');
const inline = `<script>${bundle.replace(/<\/script>/g, '<\\/script>')}</script>`;
const html = template.replace('<!--BUNDLE-->', () => inline);

const out = path.join(SRC, 'index.html');
writeFileSync(out, html);
console.log(`built ${path.relative(ROOT, out)} (${(html.length / 1024).toFixed(0)} KB)`);
