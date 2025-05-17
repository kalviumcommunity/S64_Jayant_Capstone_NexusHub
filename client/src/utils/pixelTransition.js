/**
 * Page Transition Utility
 * Provides advanced GSAP-powered transition effects for page navigation
 */
import { gsap } from 'gsap';

// Initialize the transition system
export const initializePixelTransition = () => {
  // Create the pixel canvas container if it doesn't exist
  if (!document.querySelector(".pixel-transition-container")) {
    // Create main container
    const container = document.createElement("div");
    container.className = "pixel-transition-container";
    document.body.appendChild(container);
    
    // Create canvas for pixel effect
    const canvas = document.createElement("canvas");
    canvas.className = "pixel-canvas";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    container.appendChild(canvas);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
    
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
 * Creates a grid of pixels for the transition effect
 */
const createPixelGrid = (canvas, pixelSize = 20) => {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const cols = Math.ceil(width / pixelSize);
  const rows = Math.ceil(height / pixelSize);
  const pixels = [];
  
  // Create gradient colors
  const gradientColors = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#d946ef', // Fuchsia
    '#ec4899', // Pink
    '#f43f5e', // Rose
  ];
  
  // Create pixel grid
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Get a random color from the gradient
      const colorIndex = Math.floor(Math.random() * gradientColors.length);
      
      pixels.push({
        x: x * pixelSize,
        y: y * pixelSize,
        width: pixelSize,
        height: pixelSize,
        color: gradientColors[colorIndex],
        // Initial state properties
        scale: 0,
        rotation: Math.random() * 360,
        opacity: 0,
        // Target properties for animation
        targetScale: 1,
        targetRotation: 0,
        targetOpacity: 1,
        // Delay for staggered animation
        delay: (x / cols + y / rows) * 0.5,
      });
    }
  }
  
  return { ctx, pixels, width, height };
};

/**
 * Renders the pixel grid to the canvas
 */
const renderPixels = (ctx, pixels, width, height) => {
  // Clear the canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw each pixel
  pixels.forEach(pixel => {
    ctx.save();
    ctx.globalAlpha = pixel.opacity;
    ctx.fillStyle = pixel.color;
    
    // Set the transform origin to the center of the pixel
    const centerX = pixel.x + pixel.width / 2;
    const centerY = pixel.y + pixel.height / 2;
    
    // Apply transformations
    ctx.translate(centerX, centerY);
    ctx.rotate((pixel.rotation * Math.PI) / 180);
    ctx.scale(pixel.scale, pixel.scale);
    
    // Draw the pixel
    ctx.fillRect(-pixel.width / 2, -pixel.height / 2, pixel.width, pixel.height);
    ctx.restore();
  });
};

/**
 * Performs the pixel transition animation
 */
const animatePixelTransition = (isEntering = true, callback = null) => {
  const container = document.querySelector('.pixel-transition-container');
  const canvas = document.querySelector('.pixel-canvas');
  
  if (!container || !canvas) return;
  
  // Make container visible
  container.style.display = 'block';
  container.style.opacity = '1';
  
  // Create pixel grid
  const { ctx, pixels, width, height } = createPixelGrid(canvas);
  
  // Set initial state based on whether we're entering or exiting
  if (isEntering) {
    // For enter transition, pixels start small and grow
    pixels.forEach(pixel => {
      pixel.scale = 0;
      pixel.opacity = 0;
      pixel.rotation = Math.random() * 360;
    });
  } else {
    // For exit transition, pixels start at full size
    pixels.forEach(pixel => {
      pixel.scale = 1;
      pixel.opacity = 1;
      pixel.rotation = 0;
      // Set target to be random for exit animation
      pixel.targetScale = 0;
      pixel.targetOpacity = 0;
      pixel.targetRotation = Math.random() * 360;
    });
  }
  
  // Initial render
  renderPixels(ctx, pixels, width, height);
  
  // Animation timeline
  const duration = 2; // 2 seconds as requested
  let startTime = null;
  let animationFrame = null;
  
  const animate = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000; // Convert to seconds
    
    // Update each pixel based on elapsed time
    pixels.forEach(pixel => {
      // Only start animating after the pixel's delay
      if (elapsed > pixel.delay) {
        const pixelElapsed = Math.min(1, (elapsed - pixel.delay) / (duration - pixel.delay));
        
        // Easing function (cubic ease in-out)
        const eased = pixelElapsed < 0.5
          ? 4 * pixelElapsed * pixelElapsed * pixelElapsed
          : 1 - Math.pow(-2 * pixelElapsed + 2, 3) / 2;
        
        // Interpolate values
        pixel.scale = isEntering
          ? eased * pixel.targetScale
          : 1 - eased * (1 - pixel.targetScale);
          
        pixel.opacity = isEntering
          ? eased * pixel.targetOpacity
          : 1 - eased * (1 - pixel.targetOpacity);
          
        pixel.rotation = isEntering
          ? (1 - eased) * pixel.rotation
          : eased * pixel.targetRotation;
      }
    });
    
    // Render the updated pixels
    renderPixels(ctx, pixels, width, height);
    
    // Continue animation if not complete
    if (elapsed < duration) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      // Animation complete
      if (!isEntering) {
        // Hide container after exit animation
        container.style.opacity = '0';
        setTimeout(() => {
          container.style.display = 'none';
        }, 100);
      }
      
      // Execute callback if provided
      if (callback) callback();
    }
  };
  
  // Start animation
  animationFrame = requestAnimationFrame(animate);
  
  // Return a function to cancel animation if needed
  return () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  };
};

// Advanced GSAP-powered transition effect
export const pixelTransition = {
  navigate: (navigate, path) => {
    // Start exit animation
    animatePixelTransition(false, () => {
      // Navigate after exit animation completes
      navigate(path);
      
      // Start enter animation after a short delay to allow new page to render
      setTimeout(() => {
        animatePixelTransition(true);
      }, 100);
    });
    
    return true;
  },
  
  // Method to manually trigger enter animation
  enter: () => {
    return animatePixelTransition(true);
  },
  
  // Method to manually trigger exit animation
  exit: (callback) => {
    return animatePixelTransition(false, callback);
  }
};

export default pixelTransition;