import React, { useEffect, useState } from 'react';
import PostCard from '../components/feed/PostCard';
import { useFeed } from '../context/FeedContext';

const Saved = () => {
  const { getSavedPosts } = useFeed();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      setLoading(true);
      const posts = await getSavedPosts();
      setSavedPosts(posts);
      setLoading(false);
    };
    fetchSaved();
  }, [getSavedPosts]);

  // Remove post from list on unsave
  const handleUnsave = (postId) => {
    setSavedPosts(prev => prev.filter(post => post._id !== postId));
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
        <h2 className="special-font text-4xl font-bold text-white mb-10 tracking-wide drop-shadow-lg">Saved Posts</h2>
        {/* Loader */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 w-full">
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-[#7c3aed] border-t-[#f472b6] h-16 w-16 mb-4 animate-spin"></div>
            <div className="text-white/80 text-lg font-medium mt-2">Loading saved posts...</div>
          </div>
        ) : (
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10 z-20">
            {savedPosts.length === 0 ? (
              <div className="col-span-full text-center text-white/60 py-12">No saved posts yet.</div>
            ) : (
              savedPosts.map(post => <PostCard key={post._id} post={{...post, isSaved: true, onUnsave: handleUnsave}} />)
            )}
          </div>
        )}
      </div>
      {/* No footer on this page */}
      <style>{`
        .special-font {
          font-family: 'Zentry', 'circular-web', 'robert-medium', 'sans-serif';
          letter-spacing: 0.04em;
        }
        .loader {
          border-top-color: #f472b6;
          border-right-color: #7c3aed;
          border-bottom-color: #7c3aed;
          border-left-color: #f472b6;
        }
      `}</style>
    </div>
  );
};

export default Saved; 