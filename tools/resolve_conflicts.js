const fs = require('fs');
const path = require('path');

function resolveConflictsInText(txt) {
  // Iteratively find conflict blocks and replace them with the lower block (the one after =======)
  let out = txt;
  while (true) {
    const start = out.indexOf('<<<<<<<');
    if (start === -1) break;
    const mid = out.indexOf('=======', start);
    const end = out.indexOf('>>>>>>>', mid);
    if (start === -1 || mid === -1 || end === -1) break; // malformed
    const lower = out.slice(mid + '======='.length, end);
    // Trim leading newline if present
    const replacement = lower.replace(/^\r?\n/, '');
    out = out.slice(0, start) + replacement + out.slice(end + '>>>>>>>'.length);
  }
  // Remove any stray marker lines
  out = out.replace(/^<<<<<<<.*\r?\n?/gm, '');
  out = out.replace(/^=======.*\r?\n?/gm, '');
  out = out.replace(/^>>>>>>>.*\r?\n?/gm, '');
  return out;
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else {
      try {
        let txt = fs.readFileSync(full, 'utf8');
        if (txt.indexOf('<<<<<<<') === -1 && txt.indexOf('=======') === -1 && txt.indexOf('>>>>>>>') === -1) continue;
        const newTxt = resolveConflictsInText(txt);
        if (newTxt !== txt) {
          fs.writeFileSync(full, newTxt, 'utf8');
          console.log('Fixed:', full);
        }
      } catch (e) {
        console.error('Err processing', full, e.message);
      }
    }
  }
}

const target = path.join(__dirname, '..', 'freezefood', 'src');
console.log('Scanning', target);
walk(target);
console.log('Done');
