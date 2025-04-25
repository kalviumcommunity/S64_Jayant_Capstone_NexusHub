export const initializeTransitions = () => {
  const root = document.documentElement;
  
  const endTransition = () => {
    const loader = document.querySelector(".loader");
    if (!loader) return;
    
    const handleTransitionEnd = () => {
      loader.style.transform = "translateX(100%)";
      root.classList.remove("disable-hover");
      loader.removeEventListener("transitionend", handleTransitionEnd);
    };

    loader.addEventListener("transitionend", handleTransitionEnd);
    loader.style.transform = "";
  };

  const startTransition = (route) => {
    const pageRoot = document.getElementById("page-root");
    if (!pageRoot) return;
    
    const loader = document.querySelector(".loader");
    if (!loader) return;
    
    loader.style.transform = "translateX(100%)";
    pageRoot.dataset.route = route;
    root.classList.remove("disable-hover");
  };

  const onRouteChange = (route) => {
    const pageRoot = document.getElementById("page-root");
    if (!pageRoot || pageRoot.dataset.route === route) return;
    
    root.classList.add("disable-hover");
    pageRoot.dataset.route = route;
    
    // Force a reflow to ensure the transition runs
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        endTransition();
      });
    });
  };

  // Initialize on page load
  window.addEventListener("load", () => {
    const currentRoute = window.location.pathname.split('/')[1] || 'home';
    startTransition(currentRoute);
  });

  return { onRouteChange };
}; 


// Create a new function for handling page transition
export const handlePageTransition = () => {
  initializeTransitions(); // Call the existing transition logic
};