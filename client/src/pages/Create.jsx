import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api.js';
import { FaRegSmile } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';

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
  const captionRef = useRef();
  const [showEmoji, setShowEmoji] = useState(false);

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

  // Emoji picker logic
  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const textarea = captionRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newCaption = caption.slice(0, start) + emoji + caption.slice(end);
    setCaption(newCaption);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    }, 0);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start px-2" style={{overflowX:'hidden'}}>
      {/* Fixed Background Video */}
      <video
        className="fixed top-0 left-0 w-full h-full object-cover z-0"
        src="/videos/NexusCrystal.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{ pointerEvents: 'none', filter: 'brightness(0.7) blur(1px)' }}
      />
      {/* Overlay for gradient effect */}
      <div className="fixed top-0 left-0 w-full h-full z-10 bg-gradient-to-br from-[#181c2f]/80 via-[#1a1836]/80 to-[#1e1b2b]/90 pointer-events-none" />
      {/* Heading */}
      <div className="relative z-20 w-full flex flex-col items-center" style={{paddingTop: '5.5rem'}}>
        <h2 className="special-font text-4xl md:text-5xl font-extrabold text-white mb-10 tracking-wide drop-shadow-lg" style={{letterSpacing:'0.04em'}}>
          Create {tab === 'post' ? 'Post' : 'Story'}
        </h2>
        {/* Form Container */}
        <div className="w-full max-w-2xl min-h-[520px] bg-[#181828]/80 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-[#232347] flex flex-col items-center">
          {/* Toggle */}
          <div className="flex mb-8 w-full gap-2">
            {TABS.map(t => (
              <button
                key={t.value}
                className={`flex-1 py-3 rounded-t-xl text-xl font-semibold transition-all font-circular-web ${tab === t.value ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' : 'bg-[#222] text-white/60'}`}
                onClick={() => { setTab(t.value); setCaption(''); setMedia([]); setPreview([]); }}
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full font-circular-web">
            {/* Media upload */}
            <div className="mb-6">
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
                className="w-full py-3 bg-gradient-to-r from-blue-700 to-purple-700 rounded mb-2 text-white font-semibold font-circular-web shadow-md hover:from-blue-800 hover:to-purple-800 transition text-lg"
                onClick={() => fileInputRef.current.click()}
              >
                {media.length > 0 ? `Change Media (${media.length})` : `Upload ${tab === 'post' ? 'Media' : 'Story Media'}`}
              </button>
              {/* Preview */}
              <div className="flex gap-3 overflow-x-auto mt-3">
                {preview.map((src, i) => (
                  <div key={i} className="w-24 h-36 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                    {media[i]?.type?.startsWith('image') ? (
                      <img src={src} alt="preview" className="object-cover w-full h-full" />
                    ) : (
                      <video src={src} className="object-cover w-full h-full" controls />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Caption with emoji */}
            <div className="mb-6 relative">
              <textarea
                ref={captionRef}
                className="w-full bg-[#222] rounded-lg p-3 pr-12 text-white font-circular-web text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-700 placeholder:text-gray-400"
                placeholder={tab === 'post' ? 'Write a caption...' : 'Add a story caption (optional)'}
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={3}
                style={{minHeight:'60px'}}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-2xl text-gray-400 hover:text-blue-400 transition"
                tabIndex={-1}
                onClick={() => setShowEmoji(v => !v)}
              >
                <FaRegSmile />
              </button>
              {showEmoji && (
                <div className="absolute z-50 right-0 mt-2" style={{top:'3.2rem'}}>
                  <EmojiPicker theme="dark" onEmojiClick={handleEmojiClick} height={350} width={320} />
                </div>
              )}
            </div>
            {/* Error */}
            {error && <div className="text-red-400 mb-2 text-center font-circular-web">{error}</div>}
            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-xl font-bold mt-2 disabled:opacity-60 font-circular-web shadow-md hover:from-blue-700 hover:to-purple-700 transition"
              disabled={loading || media.length === 0 || (tab === 'post' && media.length > MAX_POST_MEDIA) || (tab === 'story' && media.length > MAX_STORY_MEDIA)}
            >
              {loading ? 'Uploading...' : tab === 'post' ? 'Create Post' : 'Add Story'}
            </button>
          </form>
        </div>
      </div>
      <style>{`
        .special-font {
          font-family: 'Zentry', 'circular-web', 'robert-medium', 'sans-serif';
          letter-spacing: 0.04em;
        }
        .font-circular-web {
          font-family: 'circular-web', 'robert-medium', 'sans-serif';
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default Create; 