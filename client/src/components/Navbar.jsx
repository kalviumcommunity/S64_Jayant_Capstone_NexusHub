import clsx from "clsx";
import gsap from "gsap";
import { useWindowScroll } from "react-use";
import { useEffect, useRef, useState } from "react";
import { TiLocationArrow } from "react-icons/ti";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { initializeTransitions } from "../utils/transitions";

import Button from "./Button";

const navItems = [
  { name: "Home", type: "hash" },
  { name: "Features", type: "hash" },
  { name: "About", type: "hash" },
  { name: "Contact", type: "hash" },
  { name: "Profile", type: "route", path: "/profile" }
];

const NavBar = () => {
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
      const loader = document.querySelector(".loader");
      if (loader) {
        // Reset loader position
        loader.style.transform = "translateX(-100%)";
        // Force a reflow
        loader.offsetHeight;
        // Start transition
        loader.style.transform = "translateX(0%)";
        
        // Navigate after a longer delay to match the new transition
        setTimeout(() => {
          navigate(item.path);
        }, 300);
      } else {
        navigate(item.path);
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
            <Link to="/">
              <img src="/img/logo.png" alt="logo" className="w-10" />
            </Link>

            {!isAuthPage && (
              <Link to="/login">
                <Button
                  id="login-button"
                  title="LOGIN"
                  rightIcon={<TiLocationArrow />}
                  containerClass="bg-blue-50 md:flex hidden items-center justify-center gap-1"
                />
              </Link>
            )}
          </div>

          <div className="flex h-full items-center">
            {!isAuthPage && (
              <>
                <div className="hidden md:block">
                  {navItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleNavClick(item)}
                      className="nav-hover-btn"
                    >
                      {item.name}
                    </button>
                  ))}
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
              <Link to={location.pathname === '/login' ? '/signup' : '/login'}>
                <Button
                  id="auth-switch-button"
                  title={location.pathname === '/login' ? 'SIGN UP' : 'LOGIN'}
                  rightIcon={<TiLocationArrow />}
                  containerClass="bg-blue-50 md:flex hidden items-center justify-center gap-1"
                />
              </Link>
            )}
          </div>
        </nav>
      </header>
    </div>
  );
};

export default NavBar;
