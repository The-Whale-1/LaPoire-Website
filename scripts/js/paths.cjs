'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'artifacts', 'js');

function checkedPath(relative) {
  const target = path.resolve(output, relative);
  if (target !== output && !target.startsWith(output + path.sep)) throw new Error('Unexpected artifact path.');
  // Refuse symlinks/junctions at every existing path component before deletion or writes.
  let current = root;
  for (const part of path.relative(root, target).split(path.sep)) {
    current = path.join(current, part);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error('Artifact path contains a link.');
  }
  return target;
}
function reset(relative) {
  const target = checkedPath(relative);
  if (target === output) throw new Error('Reset individual generated outputs only.');
  fs.rmSync(target, { recursive: true, force: true });
}
module.exports = { root, output, checkedPath, reset };
