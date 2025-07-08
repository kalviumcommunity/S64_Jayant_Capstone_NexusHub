import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api.js';

const TABS = [
  { label: 'Post', value: 'post' },
  { label: 'Story', value: 'story' },
];

const Create = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const defaultTab = params.get('type') === 'story' ? 'story' : 'post';
  const [tab, setTab] = useState(defaultTab);

  // Common
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState([]); // File objects
  const [preview, setPreview] = useState([]); // Data URLs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();

  const MAX_POST_MEDIA = 10;
  const MAX_STORY_MEDIA = 5;

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    let limit = tab === 'post' ? MAX_POST_MEDIA : MAX_STORY_MEDIA;
    if (files.length > limit) {
      setError(`You can upload up to ${limit} media file${limit > 1 ? 's' : ''} for a ${tab}.`);
      setMedia([]);
      setPreview([]);
      return;
    }
    setError(null);
    setMedia(files);
    // Preview
    const readers = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then(setPreview);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      media.forEach((file) => formData.append('media', file));
      if (tab === 'post') {
        formData.append('content', caption);
        await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        navigate('/feed');
      } else {
        formData.append('caption', caption);
        await api.post('/stories', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        navigate('/feed');
      }
    } catch (err) {
      setError('Failed to create. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white py-12">
      <div className="w-full max-w-md bg-[#181818] rounded-xl shadow-lg p-6">
        {/* Toggle */}
        <div className="flex mb-6">
          {TABS.map(t => (
            <button
              key={t.value}
              className={`flex-1 py-2 rounded-t-xl text-lg font-bold transition-all ${tab === t.value ? 'bg-blue-600 text-white' : 'bg-[#222] text-white/60'}`}
              onClick={() => { setTab(t.value); setCaption(''); setMedia([]); setPreview([]); }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Media upload */}
          <div className="mb-4">
            <input
              type="file"
              accept={tab === 'post' ? 'image/*,video/*' : 'image/*,video/*'}
              multiple={tab === 'post'}
              onChange={handleMediaChange}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              type="button"
              className="w-full py-2 bg-blue-700 rounded mb-2"
              onClick={() => fileInputRef.current.click()}
            >
              {media.length > 0 ? `Change Media (${media.length})` : `Upload ${tab === 'post' ? 'Media' : 'Story Media'}`}
            </button>
            {/* Preview */}
            <div className="flex gap-2 overflow-x-auto mt-2">
              {preview.map((src, i) => (
                <div key={i} className="w-20 h-32 bg-gray-800 rounded flex items-center justify-center overflow-hidden">
                  {media[i]?.type?.startsWith('image') ? (
                    <img src={src} alt="preview" className="object-cover w-full h-full" />
                  ) : (
                    <video src={src} className="object-cover w-full h-full" controls />
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Caption */}
          <textarea
            className="w-full bg-[#222] rounded p-2 mb-4 text-white"
            placeholder={tab === 'post' ? 'Write a caption...' : 'Add a story caption (optional)'}
            value={caption}
            onChange={e => setCaption(e.target.value)}
            rows={2}
          />
          {/* Error */}
          {error && <div className="text-red-400 mb-2 text-center">{error}</div>}
          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 rounded text-lg font-bold mt-2 disabled:opacity-60"
            disabled={loading || media.length === 0 || (tab === 'post' && media.length > MAX_POST_MEDIA) || (tab === 'story' && media.length > MAX_STORY_MEDIA)}
          >
            {loading ? 'Uploading...' : tab === 'post' ? 'Create Post' : 'Add Story'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Create; 