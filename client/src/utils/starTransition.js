/**
 * Star Field Transition Utility
 * Creates a space-like star field transition effect for page navigation
 */
import { gsap } from 'gsap';

// Initialize the transition system
export const initializeStarTransition = () => {
  // Create the star transition container if it doesn't exist
  if (!document.querySelector(".star-transition-container")) {
    // Create main container
    const container = document.createElement("div");
    container.className = "star-transition-container";
    document.body.appendChild(container);
    
    // Keep the old loader for backward compatibility
    if (!document.querySelector(".loader")) {
      const loader = document.createElement("div");
      loader.className = "loader";
      document.body.appendChild(loader);
    }
  }
};

// Loader control functions (kept for backward compatibility)
export const loaderControl = {
  showLoader: () => {
    const loader = document.querySelector('.loader');
    if (loader) {
      loader.style.display = 'block';
      loader.style.opacity = '1';
    }
  },
  
  hideLoader: () => {
    const loader = document.querySelector('.loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.display = 'none';
      }, 300);
    }
  }
};

/**
 * Creates a star field for the transition effect
 */
const createStarField = (container, starCount = 150) => {
  // Clear any existing stars
  container.innerHTML = '';
  
  const stars = [];
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Create stars
  for (let i = 0; i < starCount; i++) {
    // Create star element
    const star = document.createElement('div');
    star.className = 'star-particle';
    
    // Random position
    const x = Math.random() * width;
    const y = Math.random() * height;
    
    // Random size (1-4px)
    const size = Math.random() * 3 + 1;
    
    // Set star properties
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = `${x}px`;
    star.style.top = `${y}px`;
    star.style.opacity = '0';
    
    // Add glow effect to larger stars
    if (size > 2.5) {
      star.style.animation = 'starGlow 1.5s infinite';
    }
    
    // Add to container
    container.appendChild(star);
    
    // Store star data
    stars.push({
      element: star,
      x,
      y,
      size,
      // Random speed factor for animation
      speed: Math.random() * 2 + 1,
      // Random delay for staggered appearance
      delay: Math.random() * 0.5,
    });
  }
  
  return { stars, width, height };
};

/**
 * Performs the star field transition animation
 */
const animateStarTransition = (isEntering = true, callback = null) => {
  const container = document.querySelector('.star-transition-container');
  
  if (!container) return;
  
  // Make container visible
  container.style.display = 'block';
  
  // Fade in the black background
  gsap.to(container, {
    opacity: 1,
    duration: 0.5,
    ease: 'power2.inOut',
    onComplete: () => {
      if (!isEntering) {
        // If exiting, we'll navigate in the callback
        if (callback) callback();
      }
    }
  });
  
  // Create star field
  const { stars } = createStarField(container);
  
  // Animate stars
  stars.forEach(star => {
    // Initial state
    gsap.set(star.element, {
      opacity: 0,
      scale: 0
    });
    
    // Animate each star
    gsap.to(star.element, {
      opacity: isEntering ? 1 : 0,
      scale: isEntering ? 1 : 0,
      duration: 1.5,
      delay: star.delay,
      ease: 'power2.out',
    });
    
    // Add movement for more dynamic effect
    if (isEntering) {
      gsap.to(star.element, {
        x: (Math.random() - 0.5) * 50 * star.speed,
        y: (Math.random() - 0.5) * 50 * star.speed,
        duration: 2,
        delay: star.delay + 0.2,
        ease: 'power1.inOut'
      });
    }
  });
  
  // If entering, fade out the transition after stars appear
  if (isEntering) {
    gsap.to(container, {
      opacity: 0,
      duration: 0.8,
      delay: 1.2, // Start fading out after stars have appeared
      ease: 'power2.inOut',
      onComplete: () => {
        container.style.display = 'none';
        if (callback) callback();
      }
    });
  }
  
  // Return a function to cancel animation if needed
  return () => {
    gsap.killTweensOf(container);
    stars.forEach(star => {
      gsap.killTweensOf(star.element);
    });
  };
};

// Star field transition effect
export const starTransition = {
  navigate: (navigate, path) => {
    // Start exit animation
    animateStarTransition(false, () => {
      // Navigate after exit animation completes
      navigate(path);
      
      // Start enter animation after a short delay to allow new page to render
      setTimeout(() => {
        animateStarTransition(true);
      }, 100);
    });
    
    return true;
  },
  
  // Method to manually trigger enter animation
  enter: () => {
    return animateStarTransition(true);
  },
  
  // Method to manually trigger exit animation
  exit: (callback) => {
    return animateStarTransition(false, callback);
  }
};

export default starTransition;