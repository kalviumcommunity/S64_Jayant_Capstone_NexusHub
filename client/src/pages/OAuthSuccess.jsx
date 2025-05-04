import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const OAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setOAuthLogin } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    if (token && userId) {
      // Store token and redirect to dashboard
      setOAuthLogin(token, userId);
      navigate('/dashboard');
    } else {
      // If no token, redirect to login
      navigate('/login');
    }
  }, [searchParams, navigate, setOAuthLogin]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="three-body">
          <div className="three-body__dot"></div>
          <div className="three-body__dot"></div>
          <div className="three-body__dot"></div>
        </div>
        <h2 className="text-2xl font-zentry text-white mt-6">Logging you in...</h2>
      </div>
    </div>
  );
};

export default OAuthSuccess;