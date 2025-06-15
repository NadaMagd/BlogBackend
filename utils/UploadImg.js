const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const uploadImageToImageKit = async (base64Image, fileName = "image.jpg") => {
  const result = await imagekit.upload({
    file: base64Image,
    fileName,
  });

  return result.url;
};

module.exports = uploadImageToImageKit;

