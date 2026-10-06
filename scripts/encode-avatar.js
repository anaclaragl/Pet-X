const fs = require('fs');
const path = require('path');

const imagePath = path.join(__dirname, '../assets/images/avatar_base.jpg');
const outputPath = path.join(__dirname, '../src/constants/avatars.ts');

if (!fs.existsSync(imagePath)) {
  console.error('File avatar_base.jpg not found at:', imagePath);
  process.exit(1);
}

const buffer = fs.readFileSync(imagePath);
const base64 = buffer.toString('base64');
const dataUri = `data:image/jpeg;base64,${base64}`;

const content = `// Base avatar generated from assets/images/avatar_base.jpg
export const ALICE_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

export const BASE_USER_AVATAR =
  '${dataUri}';
`;

fs.writeFileSync(outputPath, content, 'utf8');
console.log('Successfully updated src/constants/avatars.ts with BASE_USER_AVATAR data URI');
