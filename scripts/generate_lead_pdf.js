const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const htmlFilePath = path.join(__dirname, '..', 'mandvi_kutch_servora_leads.html');
const pdfFilePath = path.join(__dirname, '..', 'SERVORA_MANDVI_KUTCH_LEAD_DIRECTORY.pdf');

console.log('HTML source:', htmlFilePath);
console.log('Target PDF:', pdfFilePath);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browserExe = fs.existsSync(edgePath) ? edgePath : chromePath;

console.log('Using browser executable:', browserExe);

const args = [
  '--headless',
  '--disable-gpu',
  '--run-all-compositor-stages-before-draw',
  '--no-pdf-header-footer',
  `--print-to-pdf=${pdfFilePath}`,
  htmlFilePath
];

const result = spawnSync(browserExe, args, { stdio: 'inherit' });

if (fs.existsSync(pdfFilePath)) {
  const stats = fs.statSync(pdfFilePath);
  console.log(`SUCCESS! Generated PDF: ${pdfFilePath} (${(stats.size / 1024).toFixed(1)} KB)`);
} else {
  console.error('FAILED to generate PDF!');
}
