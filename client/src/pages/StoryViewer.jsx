import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';

const StoryViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/stories/${id}`);
        setStory(res.data.story);
        setError(null);
      } catch (err) {
        setError('Story not found or expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchStory();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Loading story...</div>;
  if (error) return <div className="flex flex-col items-center justify-center min-h-screen text-red-400">{error}<button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => navigate('/feed')}>Back to Feed</button></div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      {/* Media */}
      {story.media && story.media.length > 0 && (
        <div className="w-full max-w-md aspect-[9/16] bg-gray-900 flex items-center justify-center rounded-xl overflow-hidden">
          {story.media[0].type === 'image' ? (
            <img src={story.media[0].url} alt="story" className="object-contain w-full h-full" />
          ) : (
            <video src={story.media[0].url} controls autoPlay className="object-contain w-full h-full" />
          )}
        </div>
      )}
      {/* Caption */}
      {story.caption && <div className="mt-4 text-center text-lg">{story.caption}</div>}
      {/* Back/close button */}
      <button className="mt-8 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => navigate('/feed')}>Close</button>
    </div>
  );
};

export default StoryViewer; 