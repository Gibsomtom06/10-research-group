const fs = require('fs');
const path = require('path');

const dir = __dirname;
const bodyPath = path.join(dir, '2026-05-06-Dark-Matter-Barooka-Run-The-Game-DSR-Contract.body.html');
const outPath = path.join(dir, '2026-05-06-Dark-Matter-Barooka-Run-The-Game-DSR-Contract.html');

let body = fs.readFileSync(bodyPath, 'utf8');

// Force IN WITNESS WHEREOF and Schedule A signature heading onto a fresh page
body = body.replace(
  /<h2[^>]*>IN WITNESS WHEREOF<\/h2>/i,
  '<h2 class="sig-page-start">IN WITNESS WHEREOF</h2>'
);
body = body.replace(
  /<p><strong>AGREED AND ACCEPTED \(Schedule A confirmation\):<\/strong><\/p>/,
  '<p class="sig-page-start"><strong>AGREED AND ACCEPTED (Schedule A confirmation):</strong></p>'
);

// Wrap each signer's group of paragraphs so they don't split across pages.
// New 3-signer structure: each block is <p><strong>X (Artist)</strong>...</p>
// followed by Signature, Print Name (with optional italic guidance), Date paragraphs;
// label block also has a Title line.
body = body.replace(
  /(<p><strong>(?:Dark Matter|Barooka)\s*\(Artist\)<\/strong>[^<]*<\/p>\s*<p>Signature:[^<]*<\/p>\s*<p>Print Name:[\s\S]*?<\/p>\s*<p>Date:[^<]*<\/p>)/g,
  '<div class="sig-block">$1</div>'
);
body = body.replace(
  /(<p><strong>DirtySnatcha Records, LLC<\/strong>[^<]*<\/p>\s*<p>Signature:[^<]*<\/p>\s*<p>Print Name:[\s\S]*?<\/p>\s*<p>Title:[^<]*<\/p>\s*<p>Date:[^<]*<\/p>)/g,
  '<div class="sig-block">$1</div>'
);

const css = `@page {
  size: Letter;
  margin: 0.75in 0.75in 1in 0.75in;
  @bottom-center { content: "Page " counter(page) " of " counter(pages); font-size: 9pt; color: #555; }
}
body { font-family: Georgia, "Times New Roman", serif; font-size: 11pt; line-height: 1.5; color: #000; }
h1 { font-size: 18pt; text-align: center; margin: 0.4em 0; font-weight: bold; }
h1 + h1 { font-size: 16pt; margin-top: 0.2em; }
h2 { font-size: 13pt; margin-top: 1.6em; margin-bottom: 0.6em; page-break-after: avoid; }
h3 { font-size: 11.5pt; margin-top: 1.2em; page-break-after: avoid; }
p { margin: 0.6em 0; text-align: justify; }
ol, ul { margin: 0.6em 0; padding-left: 1.6em; }
li { margin: 0.3em 0; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 10pt; page-break-inside: avoid; }
th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; vertical-align: top; }
th { background: #f0f0f0; font-weight: bold; }
strong { font-weight: bold; }
hr { margin: 1.2em 0; border: 0; border-top: 1px solid #888; }
/* Signature pages: start fresh, never split a signer's block */
.sig-page-start { page-break-before: always; }
.sig-block { page-break-inside: avoid; margin-bottom: 0.8em; }
.sig-block p { text-align: left; margin: 0.4em 0; }`;

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>DSR License Agreement - Run The Game</title>
<style>${css}</style>
</head>
<body>
${body}
</body>
</html>`;

fs.writeFileSync(outPath, html);
console.log('wrote', outPath, html.length, 'bytes');
