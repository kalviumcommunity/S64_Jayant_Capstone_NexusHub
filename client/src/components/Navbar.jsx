import clsx from "clsx";
import gsap from "gsap";
import { useWindowScroll } from "react-use";
import { useEffect, useRef, useState } from "react";
import { TiLocationArrow } from "react-icons/ti";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { pageTransition } from "../utils/pageTransitions";
import { useAuth } from "../context/AuthContext.jsx";
import $ from "jquery";
import { motion } from "framer-motion";
import "../styles/menuNav.css";

import Button from "./Button";
import RevealLinks from "./RevealLinks";

// Navigation items before login - minimalist version
const publicNavItems = [
  { name: "Features", type: "hash" },
  { name: "Contact", type: "hash" }
];

// Navigation items after login - minimalist version
const privateNavItems = [
  { name: "Feed", type: "route", path: "/feed" },
  { name: "Explore", type: "route", path: "/explore" },
  { name: "Dashboard", type: "route", path: "/dashboard" }
];

const NavBar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isIndicatorActive, setIsIndicatorActive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const audioElementRef = useRef(null);
  const navContainerRef = useRef(null);
  const menuOverlayRef = useRef(null);

  const { y: currentScrollY } = useWindowScroll();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const toggleAudioIndicator = () => {
    setIsAudioPlaying((prev) => !prev);
    setIsIndicatorActive((prev) => !prev);
  };
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    $('.icon').toggleClass('menu').toggleClass('close');
    
    if (menuOverlayRef.current) {
      menuOverlayRef.current.classList.toggle('active');
    }
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
      // Close the menu after navigation
      setMenuOpen(false);
      $('.icon').removeClass('close').addClass('menu');
      if (menuOverlayRef.current) {
        menuOverlayRef.current.classList.remove('active');
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
  
  // Initialize menu icon
  useEffect(() => {
    // Make sure the menu icon starts in the correct state
    $('.icon').addClass('menu');
  }, []);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <>
      {/* Menu Overlay */}
      <div ref={menuOverlayRef} className="menu-overlay">
        {isAuthenticated ? (
          <section className="grid place-content-center gap-2 px-8 py-24 text-white">
            {privateNavItems.map((item, index) => (
              <FlipLink key={index} href={item.path} onClick={() => handleNavClick(item)}>
                {item.name}
              </FlipLink>
            ))}
            <FlipLink href="/profile" onClick={() => handleNavClick({ type: "route", path: "/profile" })}>
              Profile
            </FlipLink>
            <FlipLink href="#" onClick={logout}>
              Logout
            </FlipLink>
          </section>
        ) : (
          <RevealLinks />
        )}
      </div>
      
      <div
        ref={navContainerRef}
        className="fixed inset-x-0 top-4 z-50 h-16 border-none transition-all duration-700 sm:inset-x-6"
      >
        <header className="absolute top-1/2 w-full -translate-y-1/2">
          <nav className="flex size-full items-center justify-between p-4">
            {/* Left section with menu button */}
            <div className="flex items-center">
              <div className="menu-wrapper flex items-center" onClick={toggleMenu}>
                <div className="menu-icon-container">
                  <div className="menu icon"></div>
                </div>
                <div className="menu-text-container">
                  <span className="menu-text">MENU</span>
                </div>
              </div>
            </div>

            {/* Center logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
              <a href="/" onClick={(e) => { 
                e.preventDefault(); 
                if (isAuthPage) {
                  navigate('/');
                } else {
                  pageTransition.navigate(navigate, '/');
                }
              }} className="logo-container">
                <img src="/img/logo.png" alt="logo" className="w-10" />
                <span className="logo-text">NexusHub</span>
              </a>
            </div>

            {/* Right section with profile and audio */}
            <div className="flex items-center gap-4">
              {!isAuthPage && (
                <>
                  {isAuthenticated && (
                    <>
                      <button
                        onClick={() => handleNavClick({ type: "route", path: "/profile" })}
                        className="flex items-center justify-center"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-500/50">
                          {user?.profilePicture ? (
                            <img 
                              src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profilePicture}`}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                              {user?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={toggleAudioIndicator}
                    className="flex items-center space-x-0.5"
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
    </>
  );
};

// FlipLink component for menu items
const FlipLink = ({ children, href, onClick }) => {
  const DURATION = 0.25;
  const STAGGER = 0.025;

  return (
    <motion.a
      initial="initial"
      whileHover="hovered"
      href={href}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        onClick();
      }}
      className="relative block overflow-hidden whitespace-nowrap text-4xl font-black uppercase sm:text-7xl md:text-8xl lg:text-9xl"
      style={{
        lineHeight: 0.75,
      }}
    >
      <div>
        {children.split("").map((l, i) => (
          <motion.span
            variants={{
              initial: {
                y: 0,
              },
              hovered: {
                y: "-100%",
              },
            }}
            transition={{
              duration: DURATION,
              ease: "easeInOut",
              delay: STAGGER * i,
            }}
            className="inline-block"
            key={i}
          >
            {l}
          </motion.span>
        ))}
      </div>
      <div className="absolute inset-0">
        {children.split("").map((l, i) => (
          <motion.span
            variants={{
              initial: {
                y: "100%",
              },
              hovered: {
                y: 0,
              },
            }}
            transition={{
              duration: DURATION,
              ease: "easeInOut",
              delay: STAGGER * i,
            }}
            className="inline-block"
            key={i}
          >
            {l}
          </motion.span>
        ))}
      </div>
    </motion.a>
  );
};

export default NavBar;
