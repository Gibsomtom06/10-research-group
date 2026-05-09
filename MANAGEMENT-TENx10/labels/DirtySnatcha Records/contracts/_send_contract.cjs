const fs = require('fs');
const path = require('path');
const https = require('https');

const ENV_PATH = path.join(__dirname, '.env');
const env = Object.fromEntries(
  fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/).filter(Boolean).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);
const API_KEY = env.DROPBOX_SIGN_API_KEY;
if (!API_KEY) { console.error('Missing DROPBOX_SIGN_API_KEY'); process.exit(1); }

const PDF_PATH = path.join(__dirname, '2026-05-06-Dark-Matter-Barooka-Run-The-Game-DSR-Contract.pdf');
const pdfBytes = fs.readFileSync(PDF_PATH);

const signers = [
  { name: 'Isaac Tullos',          email: 'darkmatterbassmusic@gmail.com',           order: 0 },
  { name: 'Joseph Kalina',         email: 'darkmatterbassmusic+joseph@gmail.com',    order: 1 },
  { name: 'Mike Silva',            email: 'barookamusic@gmail.com',                  order: 2 },
  { name: 'Michael Zachary Thomas', email: 'barookamusic+michael@gmail.com',         order: 3 },
  { name: 'DirtySnatcha Records (Leigh Bray or Thomas Nalian)', email: 'demos@dirtysnatcharecords.com', order: 4 },
];

const message = `Hey team — contract for "Run The Game" attached for signatures.

Each member of each duo signs their own line:
  • Dark Matter: Isaac Tullos (signer 1) + Joseph Kalina (signer 2)
  • Barooka: Mike Silva (signer 3) + Michael Zachary Thomas (signer 4)
  • DirtySnatcha Records (label): signs last (signer 5)

Joseph and Michael Zachary will see the email come in via the +alias trick (Gmail delivers darkmatterbassmusic+joseph@... and barookamusic+michael@... to the same shared inboxes you already use). Just open whichever link is yours and sign.

For Barooka — please complete PRO registration with BMI (free, ~10 min at bmi.com/creators) or ASCAP, then send your IPI numbers back so we can register the composition. Without writer-side registration, your writer's share at the PRO goes uncollected.

Target release: on or before May 22, 2026.

— Thomas
DirtySnatcha Records`;

const boundary = '----DSRBoundary' + Date.now().toString(16);
const parts = [];
const push = (name, value) => {
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`);
};

push('title', 'DSR License Agreement — Run The Game');
push('subject', 'DSR License Agreement — Run The Game (signature needed)');
push('message', message);
push('test_mode', '0');
push('signing_options[draw]', '1');
push('signing_options[type]', '1');
push('signing_options[upload]', '1');
push('signing_options[phone]', '0');
push('signing_options[default_type]', 'draw');

signers.forEach((s, i) => {
  push(`signers[${i}][name]`, s.name);
  push(`signers[${i}][email_address]`, s.email);
  push(`signers[${i}][order]`, String(s.order));
});

const head = Buffer.from(parts.join(''), 'utf8');
const filePartHead = Buffer.from(
  `--${boundary}\r\nContent-Disposition: form-data; name="file[0]"; filename="2026-05-06-Dark-Matter-Barooka-Run-The-Game-DSR-Contract.pdf"\r\nContent-Type: application/pdf\r\n\r\n`,
  'utf8'
);
const tail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
const body = Buffer.concat([head, filePartHead, pdfBytes, tail]);

const auth = Buffer.from(`${API_KEY}:`).toString('base64');

const req = https.request({
  hostname: 'api.hellosign.com',
  path: '/v3/signature_request/send',
  method: 'POST',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length,
  },
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(`HTTP ${res.statusCode}`);
    try {
      const json = JSON.parse(data);
      if (json.signature_request) {
        const r = json.signature_request;
        console.log('\n✅ SIGNATURE REQUEST CREATED');
        console.log(`Request ID: ${r.signature_request_id}`);
        console.log(`Title:      ${r.title}`);
        console.log(`Subject:    ${r.subject}`);
        console.log(`Created:    ${new Date(r.created_at * 1000).toISOString()}`);
        console.log(`Sign URL:   ${r.signing_url || '(see signers below)'}`);
        console.log('\nSigners:');
        (r.signatures || []).forEach((s, i) => {
          console.log(`  ${i + 1}. ${s.signer_name} <${s.signer_email_address}>`);
          console.log(`     Order: ${s.order}  Status: ${s.status_code}  Sig ID: ${s.signature_id}`);
        });
        console.log('\nNext steps:');
        console.log(' • Recipients receive emails in signing order (Isaac first → label last).');
        console.log(' • Track at https://app.hellosign.com/home/manage');
        console.log(' • Signed final PDF will be emailed to all parties when complete.');
      } else {
        console.error('\n❌ FAILED');
        console.error(JSON.stringify(json, null, 2));
      }
    } catch (e) {
      console.error('Parse error:', e.message);
      console.log('Raw response:', data);
    }
  });
});
req.on('error', (e) => console.error('Request error:', e));
req.write(body);
req.end();
