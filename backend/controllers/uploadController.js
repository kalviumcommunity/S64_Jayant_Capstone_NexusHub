const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const streamifier = require('streamifier');

// Multer storage (memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    let cld_upload_stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(cld_upload_stream);
  });
};

exports.uploadMedia = [
  upload.single('file'),
  async (req, res) => {
    try {
      const folder = req.body.folder || 'nexushub_uploads';
      const result = await uploadToCloudinary(req.file.buffer, folder);
      res.json({ url: result.secure_url, public_id: result.public_id });
    } catch (err) {
      res.status(500).json({ error: 'Upload failed', details: err });
    }
  }
]; 