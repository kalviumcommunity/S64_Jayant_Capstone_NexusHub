// utils/pageTransitions.js
import { gsap } from 'gsap';

// Animation configurations
export const transition = {
  duration: 1,
  ease: [0.76, 0, 0.24, 1]
};

export const slide = {
  initial: {
    y: "100vh"
  },
  animate: {
    y: "0vh",
    transition
  },
  exit: {
    y: "100vh",
    transition
  }
};

// Initialize the transition system
export const initializePageTransition = () => {
  // Create the transition container if it doesn't exist
  if (!document.querySelector(".transition-container")) {
    console.log("Creating transition container");
    
    // Create main container
    const container = document.createElement("div");
    container.className = "transition-container";
    
    // Set direct styles to ensure visibility
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.right = "0";
    container.style.bottom = "0";
    container.style.zIndex = "9999";
    container.style.backgroundColor = "#6366f1"; // Set a visible background color
    
    // Create slide element
    const slide = document.createElement("div");
    slide.className = "slide";
    
    // Set direct styles to ensure visibility
    slide.style.height = "100vh";
    slide.style.width = "100%";
    slide.style.position = "fixed";
    slide.style.left = "0";
    slide.style.top = "0";
    slide.style.backgroundColor = "#8b5cf6"; // Set a visible background color
    slide.style.zIndex = "1";
    container.appendChild(slide);
    
    // Add to body
    document.body.appendChild(container);
    
    // Log to confirm container was created
    console.log("Transition container created:", document.querySelector(".transition-container"));
  } else {
    console.log("Transition container already exists");
  }
};

// Page transition controller
export const pageTransition = {
  navigate: (navigate, path) => {
    console.log(`Starting slide transition to ${path}`);
    
    // Get or create container
    let container = document.querySelector('.transition-container');
    if (!container) {
      console.log("Container not found, initializing...");
      initializePageTransition();
      container = document.querySelector('.transition-container');
      if (!container) {
        console.error("Failed to create transition container");
        navigate(path); // Fallback to direct navigation
        return false;
      }
    }
    
    // Make container visible with a background color for debugging
    container.style.display = 'block';
    container.style.backgroundColor = '#6366f1';
    container.classList.add('transition-slide');
    
    console.log('Container visible, adding slide-enter class');
    
    // Add active class to trigger animation
    container.classList.add('transition-slide-enter');
    setTimeout(() => {
      container.classList.add('transition-slide-enter-active');
      console.log('Added slide-enter-active class');
    }, 50); // Increased delay for better class application
    
    // After animation completes, navigate and setup exit animation
    setTimeout(() => {
      console.log(`Navigating to ${path}`);
      // Navigate to new page
      navigate(path);
      
      // Remove enter classes
      container.classList.remove('transition-slide-enter');
      container.classList.remove('transition-slide-enter-active');
      
      // Add exit classes after a short delay to allow new page to render
      setTimeout(() => {
        console.log('Adding slide-exit class');
        container.classList.add('transition-slide-exit');
        setTimeout(() => {
          container.classList.add('transition-slide-exit-active');
          console.log('Added slide-exit-active class');
          
          // Hide container after exit animation
          setTimeout(() => {
            console.log("Transition complete, hiding container");
            container.style.display = 'none';
            container.classList.remove('transition-slide-exit');
            container.classList.remove('transition-slide-exit-active');
            container.classList.remove('transition-slide');
          }, 1200); // Increased for better visibility
        }, 50); // Increased delay for better class application
      }, 200); // Increased delay to ensure page has loaded
    }, 1200); // Increased for better visibility
    
    return true;
  },
  
  // Method to manually trigger enter animation
  enter: () => {
    const container = document.querySelector('.transition-container');
    if (!container) return null;
    
    container.style.display = 'block';
    container.classList.add('transition-slide');
    
    // Add active class to trigger animation
    container.classList.add('transition-slide-enter');
    setTimeout(() => {
      container.classList.add('transition-slide-enter-active');
    }, 50);
    
    // Hide container after animation completes
    setTimeout(() => {
      container.classList.remove('transition-slide-enter');
      container.classList.remove('transition-slide-enter-active');
      container.classList.remove('transition-slide');
      container.style.display = 'none';
    }, 1200);
    
    // Return cancel function
    return () => {
      container.classList.remove('transition-slide-enter');
      container.classList.remove('transition-slide-enter-active');
      container.classList.remove('transition-slide');
      container.style.display = 'none';
    };
  },
  
  // Method to manually trigger exit animation
  exit: (callback) => {
    const container = document.querySelector('.transition-container');
    if (!container) return null;
    
    container.style.display = 'block';
    container.classList.add('transition-slide');
    
    // Add exit classes
    container.classList.add('transition-slide-exit');
    setTimeout(() => {
      container.classList.add('transition-slide-exit-active');
    }, 50);
    
    // Execute callback after animation completes
    setTimeout(() => {
      if (callback) callback();
      
      // Clean up classes
      container.classList.remove('transition-slide-exit');
      container.classList.remove('transition-slide-exit-active');
      container.classList.remove('transition-slide');
    }, 1200);
    
    // Return cancel function
    return () => {
      container.classList.remove('transition-slide-exit');
      container.classList.remove('transition-slide-exit-active');
      container.classList.remove('transition-slide');
      if (callback) callback();
    };
  }
};



export default pageTransition;