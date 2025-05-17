import React from 'react';

const Loader = ({ fullScreen = false }) => {
  return (
    <div className={`flex-center ${fullScreen ? 'absolute z-[100] h-dvh w-screen overflow-hidden bg-violet-50' : ''}`}>
      <div className="three-body">
        <div className="three-body__dot"></div>
        <div className="three-body__dot"></div>
        <div className="three-body__dot"></div>
      </div>
    </div>
  );
};

export default Loader;