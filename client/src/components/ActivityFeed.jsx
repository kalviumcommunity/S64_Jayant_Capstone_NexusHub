import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FiActivity, FiCalendar, FiUser, FiEdit, FiTrash2, FiCheck, FiMessageSquare, FiUserPlus } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = ({ projectId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [projectId, page]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/activities/project/${projectId}?page=${page}&limit=10`);
      
      if (page === 1) {
        setActivities(response.data.data);
      } else {
        setActivities(prev => [...prev, ...response.data.data]);
      }
      
      setHasMore(response.data.pagination.page < response.data.pagination.pages);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities');
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const getActivityIcon = (action, entityType) => {
    switch (action) {
      case 'created':
        return <FiActivity className="text-green-400" />;
      case 'updated':
        return <FiEdit className="text-blue-400" />;
      case 'deleted':
        return <FiTrash2 className="text-red-400" />;
      case 'completed':
        return <FiCheck className="text-green-500" />;
      case 'commented':
        return <FiMessageSquare className="text-yellow-400" />;
      case 'assigned':
      case 'joined':
        return <FiUserPlus className="text-purple-400" />;
      default:
        return <FiActivity className="text-gray-400" />;
    }
  };

  if (error) {
    return (
      <div className="text-white/60 text-center py-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.length === 0 && !loading ? (
        <div className="text-white/60 text-center py-4">
          <p>No activities recorded yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity._id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                <div className="p-2 rounded-full bg-white/10">
                  {getActivityIcon(activity.action, activity.entityType)}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/60">
                    <div className="flex items-center gap-1">
                      <FiUser size={12} />
                      <span>{activity.userId?.name || 'Unknown user'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiCalendar size={12} />
                      <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-4 py-2 text-sm text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivityFeed;