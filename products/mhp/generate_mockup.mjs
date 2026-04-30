import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY not set. Run from tenx10-platform with dotenv or set manually.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const INPUT_IMAGE = process.argv[2]; // optional: path to flat design or worn photo

const JERSEY_DESCRIPTION = `
A custom sublimated hockey jersey for DirtySnatcha Records (DSR), a dubstep/bass music label.

FRONT:
- Dark navy/black base with full-body psychedelic sublimation print
- Large DS bolt logo (lightning bolt, neon green-to-yellow gradient) centered on chest, 11 inches wide
- Two alien figures in colorful streetwear outfits flanking the bolt logo — one in orange jacket, one in green — with psychedelic smoke trails rising from their heads
- Purple galaxy clouds, planets, and cosmic flora in the background
- Neon yellow-green solid panels on upper sleeves/shoulders
- Two neon yellow-green stripes on each lower sleeve
- Small winged eyeball patches on both sleeve cuffs
- Black lace-up V-neck collar with DSR shield logo sublimated above the lace

BACK:
- "DirtySnatcha" wordmark in neon green-to-yellow gradient at top center, custom angular font
- Large UFO (flying saucer) beaming a green tractor beam down
- Festival crowd of people looking up at the UFO
- Psychedelic alien flora and mushrooms at the bottom
- Same galaxy/cosmic background throughout

STYLE: Festival merch, streetwear, psychedelic, vibrant neon colors on dark base, bass music culture aesthetic.
`;

async function generateMockup() {
  console.log('Generating DirtySnatcha hockey jersey mockup with Gemini...');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-preview-image-generation',
  });

  const parts = [];

  // If a reference image is provided, include it
  if (INPUT_IMAGE && fs.existsSync(INPUT_IMAGE)) {
    console.log(`Using reference image: ${INPUT_IMAGE}`);
    const imageData = fs.readFileSync(INPUT_IMAGE);
    const ext = path.extname(INPUT_IMAGE).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    parts.push({
      inlineData: {
        data: imageData.toString('base64'),
        mimeType,
      },
    });
    parts.push({
      text: `Using this as reference, generate a clean professional product photo mockup of this hockey jersey. Show it worn by a model, front view, clean white or gradient background, high-quality product photography lighting. The jersey details: ${JERSEY_DESCRIPTION}`,
    });
  } else {
    parts.push({
      text: `Generate a clean, professional product photo mockup of a custom hockey jersey. Show it worn by a model, front view, clean white background, high-quality product photography style. Jersey details: ${JERSEY_DESCRIPTION}`,
    });
  }

  const response = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  });

  const candidates = response.response.candidates;
  if (!candidates || candidates.length === 0) {
    console.error('No response from Gemini.');
    process.exit(1);
  }

  let saved = false;
  for (const part of candidates[0].content.parts) {
    if (part.inlineData) {
      const outputPath = path.join(
        'C:\\Users\\Slash\\10 Research Group\\products\\mhp',
        `DS_hockey_jersey_mockup_${Date.now()}.png`
      );
      fs.writeFileSync(outputPath, Buffer.from(part.inlineData.data, 'base64'));
      console.log(`Mockup saved: ${outputPath}`);
      saved = true;
    } else if (part.text) {
      console.log('Gemini note:', part.text);
    }
  }

  if (!saved) {
    console.error('No image was generated. Gemini may have returned text only.');
    console.log('Full response:', JSON.stringify(candidates[0].content, null, 2));
  }
}

generateMockup().catch(console.error);
