require('dotenv').config();
const fs = require('fs');
const ImageKit = require('imagekit');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const imageBuffer = fs.readFileSync('./anime-moon-landscape.jpg'); // صورة صغيرة بجانب الملف

imagekit.upload(
  {
    file: imageBuffer.toString('base64'),
    fileName: 'test.jpg',
  },
  function (error, result) {
    if (error) console.log("❌ Upload error:", error);
    else console.log("✅ Upload success:", result);
  }
);
