"use client";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Children,
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./Dock.css";

function DockItem({
  children,
  className = "",
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  notificationCount = 0,
  isDrawerMode = false,
  isActive = false,
}) {
  const ref = useRef(null);
  const isHovered = useMotionValue(0);
  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize,
    };
    return val - rect.x - baseItemSize / 2;
  });
  
  // Modified magnification behavior - only magnify hovered and adjacent items
  const targetSize = useTransform(
    mouseDistance,
    [-distance/4, 0, distance/4],
    [baseItemSize * 1.2, magnification, baseItemSize * 1.2]
  );
  const size = useSpring(targetSize, spring);
  
  // Drawer mode renders differently
  if (isDrawerMode) {
    return (
      <div
        onClick={onClick}
        className={`mobile-drawer-item ${isActive ? 'active' : ''} ${className}`}
        tabIndex={0}
        role="button"
      >
        <div className="dock-icon">
          {Children.map(children, (child) => {
            if (child.type === DockIcon) return child;
            return null;
          })}
        </div>
        <div className="item-label">
          {Children.map(children, (child) => {
            if (child.type === DockLabel) return child.props.children;
            return null;
          })}
        </div>
        {notificationCount > 0 && (
          <div className="notification-badge">
            {notificationCount > 9 ? '9+' : notificationCount}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <motion.div
      ref={ref}
      style={{
        width: size,
        height: size,
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`dock-item ${className} ${isActive ? 'active-dock-item' : ''}`}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      {Children.map(children, (child) =>
        cloneElement(child, { isHovered })
      )}
      
      {/* Notification badge */}
      {notificationCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {notificationCount > 9 ? '9+' : notificationCount}
        </div>
      )}
    </motion.div>
  );
}

function DockLabel({ children, className = "", ...rest }) {
  const { isHovered } = rest;
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);
  
  // For vertical dock, we'll use a different style via CSS
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`dock-label ${className}`}
          role="tooltip"
          style={{ x: "-50%" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className = "" }) {
  return <div className={`dock-icon ${className}`}>{children}</div>;
}

// Mobile Hamburger Toggle Component
function MobileToggle({ isOpen, onToggle }) {
  return (
    <div className="mobile-dock-toggle" onClick={onToggle}>
      <div className={`hamburger ${isOpen ? 'open' : ''}`}>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}

// Mobile Drawer Component
function MobileDrawer({ items, isOpen, onClose, activeItem, onItemClick }) {
  return (
    <>
      <div 
        className={`mobile-dock-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />
      <motion.div
        className={`mobile-dock-drawer ${isOpen ? 'open' : ''}`}
        initial={false}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30 
        }}
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={() => onItemClick(item, index)}
            className={item.className || ''}
            mouseX={useMotionValue(0)}
            spring={{ mass: 0.1, stiffness: 150, damping: 12 }}
            distance={0}
            magnification={0}
            baseItemSize={24}
            notificationCount={item.notificationCount || 0}
            isDrawerMode={true}
            isActive={activeItem === index}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </>
  );
}

export default function Dock({
  items,
  className = "",
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  dockHeight = 256,
  baseItemSize = 50,
  vertical = false,
  mobileMode = "drawer", // "drawer" or "bottom"
}) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  
  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [magnification, dockHeight]
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);
  
  // Handle responsive breakpoint detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Handle item click with active state and drawer closing
  const handleItemClick = (item, index) => {
    setActiveItem(index);
    if (item.onClick) {
      item.onClick();
    }
    // Close drawer on mobile after clicking
    if (isMobile && mobileMode === "drawer") {
      setIsDrawerOpen(false);
    }
  };
  
  // Handle drawer toggle
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };
  
  // Handle escape key to close drawer
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isDrawerOpen]);
  
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen]);
  
  // Mobile drawer mode
  if (isMobile && mobileMode === "drawer") {
    return (
      <>
        <MobileToggle isOpen={isDrawerOpen} onToggle={toggleDrawer} />
        <MobileDrawer 
          items={items}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          activeItem={activeItem}
          onItemClick={handleItemClick}
        />
      </>
    );
  }
  
  // Mobile bottom dock mode
  if (isMobile && mobileMode === "bottom") {
    return (
      <motion.div
        className="dock-outer"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className={`dock-panel mobile-bottom ${className}`}
          role="toolbar"
          aria-label="Application dock"
        >
          {items.map((item, index) => (
            <DockItem
              key={index}
              onClick={() => handleItemClick(item, index)}
              className={`${item.className || ''}`}
              mouseX={mouseX}
              spring={spring}
              distance={distance}
              magnification={magnification}
              baseItemSize={baseItemSize}
              notificationCount={item.notificationCount || 0}
              isActive={activeItem === index}
            >
              <DockIcon>{item.icon}</DockIcon>
              <DockLabel>{item.label}</DockLabel>
            </DockItem>
          ))}
        </motion.div>
      </motion.div>
    );
  }
  
  // Desktop vertical dock (default)
  return (
    <motion.div
      style={{ height, scrollbarWidth: "none" }}
      className="dock-outer"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={`dock-panel ${className} ${vertical ? 'vertical' : ''}`}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={() => handleItemClick(item, index)}
            className={`${item.className || ''}`}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            notificationCount={item.notificationCount || 0}
            isActive={activeItem === index}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}