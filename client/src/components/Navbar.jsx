import clsx from "clsx";
import gsap from "gsap";
import { useWindowScroll } from "react-use";
import { useEffect, useRef, useState } from "react";
import { TiLocationArrow } from "react-icons/ti";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { pageTransition } from "../utils/pageTransitions";
import { useAuth } from "../context/AuthContext.jsx";

import Button from "./Button";

// Navigation items before login
const publicNavItems = [
  { name: "Home", type: "hash" },
  { name: "Features", type: "hash" },
  { name: "About", type: "hash" },
  { name: "Contact", type: "hash" }
];

// Navigation items after login
const privateNavItems = [
  { name: "Feed", type: "route", path: "/feed" },
  { name: "Dashboard", type: "route", path: "/dashboard" },
  { name: "Profile", type: "route", path: "/profile" }
];

const NavBar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isIndicatorActive, setIsIndicatorActive] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const audioElementRef = useRef(null);
  const navContainerRef = useRef(null);

  const { y: currentScrollY } = useWindowScroll();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const toggleAudioIndicator = () => {
    setIsAudioPlaying((prev) => !prev);
    setIsIndicatorActive((prev) => !prev);
  };

  const handleNavClick = async (item) => {
    if (item.type === "route") {
      // Check if navigating to auth pages
      if (item.path === '/login' || item.path === '/signup') {
        // Direct navigation without transition for auth pages
        navigate(item.path);
      } else {
        // Use the page transition for other routes
        pageTransition.navigate(navigate, item.path);
      }
    } else {
      // Handle hash navigation
      const element = document.querySelector(`#${item.name.toLowerCase()}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  useEffect(() => {
    if (audioElementRef.current) {
      if (isAudioPlaying) {
        audioElementRef.current.play();
      } else {
        audioElementRef.current.pause();
      }
    }
  }, [isAudioPlaying]);

  useEffect(() => {
    if (currentScrollY === 0) {
      setIsNavVisible(true);
      navContainerRef.current?.classList.remove("floating-nav");
    } else if (currentScrollY > lastScrollY) {
      setIsNavVisible(false);
      navContainerRef.current?.classList.add("floating-nav");
    } else if (currentScrollY < lastScrollY) {
      setIsNavVisible(true);
      navContainerRef.current?.classList.add("floating-nav");
    }

    setLastScrollY(currentScrollY);
  }, [currentScrollY, lastScrollY]);

  useEffect(() => {
    gsap.to(navContainerRef.current, {
      y: isNavVisible ? 0 : -100,
      opacity: isNavVisible ? 1 : 0,
      duration: 0.2,
    });
  }, [isNavVisible]);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div
      ref={navContainerRef}
      className="fixed inset-x-0 top-4 z-50 h-16 border-none transition-all duration-700 sm:inset-x-6"
    >
      <header className="absolute top-1/2 w-full -translate-y-1/2">
        <nav className="flex size-full items-center justify-between p-4">
          <div className="flex items-center gap-7">
            <a href="/" onClick={(e) => { 
              e.preventDefault(); 
              // Use direct navigation if coming from auth pages
              if (isAuthPage) {
                navigate('/');
              } else {
                pageTransition.navigate(navigate, '/');
              }
            }}>
              <img src="/img/logo.png" alt="logo" className="w-10" />
            </a>

            {!isAuthPage && !isAuthenticated && (
              <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                <Button
                  id="login-button"
                  title="LOGIN"
                  rightIcon={<TiLocationArrow />}
                  containerClass="bg-blue-50 md:flex hidden items-center justify-center gap-1"
                />
              </a>
            )}
            
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-white text-sm">{user?.name || 'User'}</span>
              </div>
            )}
          </div>

          <div className="flex h-full items-center">
            {!isAuthPage && (
              <>
                <div className="hidden md:block">
                  {(isAuthenticated ? privateNavItems : publicNavItems).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleNavClick(item)}
                      className="nav-hover-btn"
                    >
                      {item.name}
                    </button>
                  ))}
                  
                  {isAuthenticated && (
                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="nav-hover-btn text-red-400"
                    >
                      Logout
                    </button>
                  )}
                </div>

                <button
                  onClick={toggleAudioIndicator}
                  className="ml-10 flex items-center space-x-0.5"
                >
                  <audio
                    ref={audioElementRef}
                    className="hidden"
                    src="/audio/loop.mp3"
                    loop
                  />
                  {[1, 2, 3, 4].map((bar) => (
                    <div
                      key={bar}
                      className={clsx("indicator-line", {
                        active: isIndicatorActive,
                      })}
                      style={{
                        animationDelay: `${bar * 0.1}s`,
                      }}
                    />
                  ))}
                </button>
              </>
            )}

            {isAuthPage && (
              <a 
                href={location.pathname === '/login' ? '/signup' : '/login'} 
                onClick={(e) => { 
                  e.preventDefault(); 
                  navigate(location.pathname === '/login' ? '/signup' : '/login'); 
                }}
              >
                <Button
                  id="auth-switch-button"
                  title={location.pathname === '/login' ? 'SIGN UP' : 'LOGIN'}
                  rightIcon={<TiLocationArrow />}
                  containerClass="bg-blue-50 md:flex hidden items-center justify-center gap-1"
                />
              </a>
            )}
          </div>
        </nav>
      </header>
    </div>
  );
};

export default NavBar;
