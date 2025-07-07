import axios from 'axios';

export const uploadMedia = async (file, folder = 'nexushub_uploads') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await axios.post('/api/upload/media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url; // Cloudinary URL
}; 