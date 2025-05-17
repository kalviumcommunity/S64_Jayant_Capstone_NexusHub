/**
 * Simplified loader system
 * - Maintains the three-dot loader effect
 * - Removes page transitions
 */

// Initialize the loader system
export const initializeLoader = () => {
  // Only create the loader once
  if (!document.querySelector(".loader")) {
    const loader = document.createElement("div");
    loader.className = "loader";
    loader.style.transform = "translateX(100%)"; // Start off-screen
    document.body.appendChild(loader);
  }
};

// Utility functions for loader control
export const loaderControl = {
  // Hide the loader (move it off-screen)
  hideLoader: () => {
    const loader = document.querySelector(".loader");
    if (loader) {
      loader.style.transform = "translateX(100%)";
    }
  },
  
  // Simple navigation without transitions
  navigate: (navigateFunction, path) => {
    // Just navigate directly without transitions
    navigateFunction(path);
  }
};

// For backward compatibility
export const pageTransition = loaderControl;
export const initializeTransitions = initializeLoader;
export const handlePageTransition = initializeLoader;