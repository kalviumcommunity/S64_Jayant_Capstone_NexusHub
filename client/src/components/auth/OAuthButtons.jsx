import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';

const OAuthButtons = () => {
  const handleGoogleLogin = () => {
    // Always try to redirect, even if we think it's not configured
    // The backend will handle the error case gracefully
    window.location.href = 'http://localhost:5000/api/oauth/google';
  };

  const handleGithubLogin = () => {
    // Always try to redirect, even if we think it's not configured
    // The backend will handle the error case gracefully
    window.location.href = 'http://localhost:5000/api/oauth/github';
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/20"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-black/25 text-white/70">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex items-center justify-center w-full px-4 py-2.5 border border-white/20 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-white font-robert-regular relative z-40"
          title="Sign in with Google"
        >
          <FcGoogle className="w-5 h-5 mr-2" />
          Google
        </button>
        
        <button
          type="button"
          onClick={handleGithubLogin}
          className="flex items-center justify-center w-full px-4 py-2.5 border border-white/20 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-white font-robert-regular relative z-40"
          title="Sign in with GitHub"
        >
          <FaGithub className="w-4 h-4 mr-2 text-white" />
          GitHub
        </button>
      </div>
    </div>
  );
};

export default OAuthButtons;