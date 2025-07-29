import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import api from '../utils/api';

const RightSidebar = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const [teamsRes, usersRes] = await Promise.all([
          api.get('/teams/suggested'),
          api.get('/users/suggested')
        ]);
        setTeams(teamsRes.data.teams || []);
        setUsers(usersRes.data.users || []);
      } catch (err) {
        setError('Could not load suggestions.');
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  // Join or request to join a team
  const handleJoinTeam = async (team) => {
    setActionLoading(team._id);
    try {
      if (team.isPublic) {
        await api.post(`/teams/${team._id}/join`);
      } else {
        await api.post(`/teams/${team._id}/join`); // Same endpoint, backend handles request logic
      }
      // Optionally update UI or show success
    } catch (err) {
      // Optionally show error
    } finally {
      setActionLoading('');
    }
  };

  // Follow a user
  const handleFollow = async (user) => {
    setActionLoading(user._id);
    try {
      await api.post('/users/follow', { userId: user._id });
      // Optionally update UI or show success
    } catch (err) {
      // Optionally show error
    } finally {
      setActionLoading('');
    }
  };

  return (
    <aside className="w-full max-w-xs space-y-8">
      {/* Suggested Teams */}
      <div className="bg-[#181818] rounded-xl p-4 border border-[#222]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Suggested Teams</h3>
          <Button
            title="View All"
            containerClass="bg-white text-black font-zentry font-bold uppercase px-7 py-3 flex items-center gap-2 shadow hover:bg-yellow-200 active:scale-95 transition text-xs"
            onClick={() => navigate('/explore')}
          />
        </div>
        {loading ? (
          <div className="text-white/60 text-center py-4">Loading...</div>
        ) : error && teams.length === 0 ? (
          <div className="text-red-400 text-center py-4">{error}</div>
        ) : (
          <div className="space-y-3">
            {teams.length === 0 ? (
              <div className="text-white/60 text-center py-4">No personalized suggestions found. Try joining public teams or explore more!</div>
            ) : teams.map(team => (
              <div key={team._id} className="flex items-center justify-between bg-[#232323] rounded-lg px-3 py-2 relative overflow-hidden">
                {/* Team Banner Background */}
                {team.banner && (
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={team.banner.startsWith('http') ? team.banner : `http://localhost:5000${team.banner}`}
                      alt={`${team.name} banner`}
                      className="w-full h-full object-cover opacity-10"
                    />
                    <div className="absolute inset-0 bg-black/40"></div>
                  </div>
                )}
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                    {team.avatar && <img src={team.avatar} alt={team.name} className="w-full h-full object-cover rounded-full" />}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{team.name}</div>
                    <div className="text-gray-400 text-xs">{team.tags?.join(', ')}</div>
                  </div>
                </div>
                <Button
                  title={team.isPublic ? 'Join' : 'Request to Join'}
                  containerClass="bg-white text-black font-zentry font-bold uppercase px-4 py-1 flex items-center gap-2 shadow hover:bg-yellow-200 active:scale-95 transition text-xs relative z-10"
                  onClick={() => handleJoinTeam(team)}
                  disabled={actionLoading === team._id}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Suggested for You */}
      <div className="bg-[#181818] rounded-xl p-4 border border-[#222] mt-4 mb-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Suggested for You</h3>
          <Button
            title="View All"
            containerClass="bg-white text-black font-zentry font-bold uppercase px-7 py-3 flex items-center gap-2 shadow hover:bg-yellow-200 active:scale-95 transition text-xs"
            onClick={() => navigate('/explore')}
          />
        </div>
        {loading ? (
          <div className="text-white/60 text-center py-4">Loading...</div>
        ) : error ? (
          <div className="text-red-400 text-center py-4">{error}</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {users.length === 0 ? (
              <div className="text-white/60 text-center py-4">No suggestions found.</div>
            ) : users.map(user => (
              <div key={user._id} className="flex flex-col items-center min-w-[90px] bg-[#232323] rounded-lg px-3 py-3">
                <div className="w-12 h-12 rounded-full bg-gray-700 mb-1 overflow-hidden">
                  {user.profilePicture && <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover rounded-full" />}
                </div>
                <div className="text-white text-xs font-medium">{user.username}</div>
                <div className="text-gray-400 text-xs mb-1 truncate max-w-[60px]">{user.skills?.join(', ')}</div>
                <Button
                  title="Follow"
                  containerClass="bg-white text-black font-zentry font-bold uppercase px-2 py-1 flex items-center gap-2 shadow hover:bg-yellow-200 active:scale-95 transition text-xs"
                  onClick={() => handleFollow(user)}
                  disabled={actionLoading === user._id}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </aside>
  );
};

export default RightSidebar; 