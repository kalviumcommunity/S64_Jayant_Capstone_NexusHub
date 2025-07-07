import React, { useState, useRef, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const cubeVariants = {
  enter: (direction) => ({
    rotateY: direction === 1 ? 90 : -90,
    opacity: 0,
    zIndex: 0,
  }),
  center: {
    rotateY: 0,
    opacity: 1,
    zIndex: 1,
    transition: { duration: 0.6, ease: [0.4, 0.0, 0.2, 1] },
  },
  exit: (direction) => ({
    rotateY: direction === 1 ? -90 : 90,
    opacity: 0,
    zIndex: 0,
    transition: { duration: 0.6, ease: [0.4, 0.0, 0.2, 1] },
  }),
};

const MediaCarousel = ({ media }) => {
  const [current, setCurrent] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef(null);
  const startX = useRef(null);
  const isDragging = useRef(false);
  const [direction, setDirection] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef(null);

  if (!media || media.length === 0) return null;

  // Touch/Mouse drag handlers for sliding
  const handleDragStart = (e) => {
    isDragging.current = true;
    startX.current = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
  };
  const handleDragMove = (e) => {
    if (!isDragging.current) return;
    const x = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const diff = x - startX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0 && current < media.length - 1) goTo(current + 1);
      else if (diff > 0 && current > 0) goTo(current - 1);
      isDragging.current = false;
    }
  };
  const handleDragEnd = () => {
    isDragging.current = false;
  };

  const handleMuteToggle = () => {
    setIsMuted((prev) => !prev);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVideoTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration || 0);
    }
  };

  const formatTime = (t) => {
    const min = Math.floor(t / 60);
    const sec = Math.floor(t % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const goTo = (idx) => {
    if (idx === current) return;
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  };

  const currentMedia = media[current];

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.5 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => { if (containerRef.current) observer.unobserve(containerRef.current); };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square bg-black flex items-center justify-center rounded-lg overflow-hidden select-none perspective-[1200px]"
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      style={{ cursor: 'default' }}
    >
      {/* Left Arrow (desktop only, show if not first slide) */}
      {media.length > 1 && current > 0 && (
        <button
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white rounded-full p-1.5 z-20 border border-white/10 shadow"
          style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
          onClick={() => goTo(current - 1)}
          tabIndex={0}
          aria-label="Previous"
        >
          <FiChevronLeft size={20} />
        </button>
      )}
      {/* Right Arrow (desktop only, show if not last slide) */}
      {media.length > 1 && current < media.length - 1 && (
        <button
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white rounded-full p-1.5 z-20 border border-white/10 shadow"
          style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
          onClick={() => goTo(current + 1)}
          tabIndex={0}
          aria-label="Next"
        >
          <FiChevronRight size={20} />
        </button>
      )}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={cubeVariants}
          initial="enter"
          animate="center"
          exit="exit"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            backfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d',
            willChange: 'transform, opacity',
          }}
        >
          {/* Media */}
          {currentMedia.type === 'image' ? (
            <img
              src={currentMedia.url}
              alt="post media"
              className="object-contain w-full h-full"
              draggable={false}
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                src={currentMedia.url}
                className="object-contain w-full h-full"
                autoPlay={isInView}
                loop
                muted={!isInView || isMuted}
                playsInline
                controls={false}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
              />
              {/* Video Timer (top-right, decreasing) */}
              <div className="absolute top-3 right-3 text-white text-base px-2 py-0.5 rounded z-10" style={{fontWeight:400, fontSize:'1.1rem', background:'rgba(0,0,0,0.0)'}}>
                {formatTime(Math.max(0, videoDuration - videoTime))}
              </div>
              {/* Mute/Unmute Button */}
              <button
                className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 z-10"
                onClick={handleMuteToggle}
                type="button"
              >
                {isMuted ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {/* Dots */}
      {media.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {media.map((_, idx) => (
            <span
              key={idx}
              className={`w-2 h-2 rounded-full ${idx === current ? 'bg-white' : 'bg-white/40'}`}
              onClick={() => goTo(idx)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaCarousel; 