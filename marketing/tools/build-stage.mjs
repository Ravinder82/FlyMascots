/**
 * Build the self-contained Axo stage: bundles three + engine + viewer into
 * one HTML that opens from file:// with zero network access.
 *
 * Usage: node marketing/tools/build-stage.mjs
 */
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const SRC = path.join(ROOT, 'site/src');

const result = await build({
  entryPoints: [path.join(SRC, 'stage.js')],
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
const template = readFileSync(path.join(SRC, 'template.html'), 'utf8');
const inline = `<script>${bundle.replace(/<\/script>/g, '<\\/script>')}</script>`;
// Use a replacer function: the minified bundle contains `$` sequences that
// String.replace would otherwise interpret as replacement patterns.
const html = template.replace('<!--BUNDLE-->', () => inline);

const out = path.join(ROOT, 'site/axo-stage.html');
writeFileSync(out, html);
console.log(`built ${out} (${(html.length / 1024).toFixed(0)} KB)`);
