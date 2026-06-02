const cloudinary = require("cloudinary").v2;

// Validate Cloudinary configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("⚠️  WARNING: Cloudinary is not properly configured!");
  console.warn("Missing environment variables:");
  if (!process.env.CLOUDINARY_CLOUD_NAME) console.warn("  - CLOUDINARY_CLOUD_NAME");
  if (!process.env.CLOUDINARY_API_KEY) console.warn("  - CLOUDINARY_API_KEY");
  if (!process.env.CLOUDINARY_API_SECRET) console.warn("  - CLOUDINARY_API_SECRET");
  console.warn("\nImage uploads will fail. Please add these to server/.env and restart.");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;