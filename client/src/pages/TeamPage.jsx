import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TeamDetails from '../components/TeamDetails';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FiAlertCircle } from 'react-icons/fi';

const TeamPage = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [team, setTeam] = useState(null);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!teamId) {
        console.error('No team ID provided');
        navigate('/dashboard');
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching team with ID:', teamId);
        
        // Add a small delay to ensure the API is ready to respond
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const response = await api.get(`/teams/${teamId}`);
        
        if (response.data && response.data.data) {
          console.log('Team data received:', response.data.data);
          setTeam(response.data.data);
        } else {
          console.error('Invalid team data structure:', response.data);
          setError('Team not found');
        }
      } catch (err) {
        console.error('Error fetching team:', err);
        
        if (err.response) {
          if (err.response.status === 404) {
            setError('Team not found. It may have been deleted.');
          } else if (err.response.status === 403) {
            setError('You do not have permission to view this team.');
          } else {
            setError(`Failed to load team details: ${err.response.status} ${err.response.statusText}`);
          }
        } else if (err.request) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError('Failed to load team details');
        }
      } finally {
        setLoading(false);
      }
    };

    // Ensure teamId is valid before fetching
    if (teamId) {
      fetchTeam();
    } else {
      setError('Invalid team ID');
      setLoading(false);
    }
  }, [teamId, navigate]);

  const handleClose = () => {
    // Use navigate instead of direct window location change
    navigate('/dashboard', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full py-12">
        <div className="three-body">
          <div className="three-body__dot"></div>
          <div className="three-body__dot"></div>
          <div className="three-body__dot"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="flex items-center justify-center mb-4">
          <FiAlertCircle size={40} className="text-red-400" />
        </div>
        <p className="text-red-400 mb-2">{error}</p>
        <button 
          onClick={handleClose}
          className="mt-4 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <TeamDetails teamId={teamId} onClose={handleClose} />
    </motion.div>
  );
};

export default TeamPage;