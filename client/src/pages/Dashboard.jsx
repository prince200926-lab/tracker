import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import socket from '../services/socket';

const Dashboard = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    fetchGroups();

    const handleGroupUpdate = () => fetchGroups();
    const handleGroupDeleted = (data) => {
      setGroups(prev => prev.filter(g => g.groupId !== data.groupId));
    };
    const handleGroupCreated = (data) => {
      if (data.leaderId === user.userId || data.members?.includes(user.userId)) {
        fetchGroups();
      }
    };

    socket.on('member-joined', handleGroupUpdate);
    socket.on('group-deleted', handleGroupDeleted);
    socket.on('group-created', handleGroupCreated);
    socket.on('join-request-responded', handleGroupUpdate);
    
    return () => {
      socket.off('member-joined', handleGroupUpdate);
      socket.off('group-deleted', handleGroupDeleted);
      socket.off('group-created', handleGroupCreated);
      socket.off('join-request-responded', handleGroupUpdate);
    };
  }, [user, authLoading, navigate]);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups/user');
      setGroups(response.data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async (groupId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      await api.post('/groups/leave', { groupId });
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave group');
    }
  };

  const handleDeleteGroup = async (groupId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this group? This cannot be undone.')) return;
    try {
      await api.delete(`/groups/${groupId}`);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete group');
    }
  };

  const handleCreateGroup = () => navigate('/create-group');
  const handleJoinGroup = () => navigate('/join-group');
  const handleLogout = () => { logout(); navigate('/login'); };
  const handleGroupClick = (groupId) => navigate(`/group/${groupId}`);

  if (authLoading || loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  const myGroups = groups.filter(g => g.members?.some(m => (m.userId || m) === user?.userId));
  const ledGroups = myGroups.filter(g => g.leaderId === user?.userId);
  const memberGroups = myGroups.filter(g => g.leaderId !== user?.userId);

  return (
    <div>
      <header>
        <div>
          <h1>Academic Goals Tracker</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Welcome, {user?.displayName || user?.username}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={toggleTheme} style={{ padding: '8px 12px' }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
          <button onClick={handleLogout} style={{ padding: '8px 12px' }}>Logout</button>
        </div>
      </header>
      <main>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <h2 style={{ textAlign: 'center', margin: 0 }}>Your Groups</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={handleCreateGroup} style={{ background: 'var(--accent)', color: 'white', border: 'none' }}>Create Group</button>
            <button onClick={handleJoinGroup}>Join Group</button>
          </div>
        </div>

        {myGroups.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>You haven't joined any groups yet</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleCreateGroup} style={{ background: 'var(--accent)', color: 'white', border: 'none' }}>Create Group</button>
              <button onClick={handleJoinGroup}>Join Group</button>
            </div>
          </div>
        ) : (
          <>
            {ledGroups.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ color: 'var(--text-secondary)', marginBottom: '12px', textAlign: 'center' }}>Groups You Lead ({ledGroups.length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {ledGroups.map(group => (
                    <div key={group.groupId} className="card" onClick={() => handleGroupClick(group.groupId)} style={{ cursor: 'pointer', border: '2px solid var(--accent)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <h3 style={{ margin: 0 }}>{group.groupName}</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>{group.members?.length || 0} members</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>Code: {group.groupCode}</p>
                        </div>
                        <span style={{ background: 'var(--accent)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', whiteSpace: 'nowrap' }}>Leader</span>
                      </div>
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/group/${group.groupId}`); }} style={{ flex: 1, fontSize: '13px' }}>Manage</button>
                        <button onClick={(e) => handleDeleteGroup(group.groupId, e)} style={{ background: 'var(--error)', color: 'white', border: 'none', fontSize: '13px' }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {memberGroups.length > 0 && (
              <div>
                <h3 style={{ color: 'var(--text-secondary)', marginBottom: '12px', textAlign: 'center' }}>Groups You're In ({memberGroups.length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {memberGroups.map(group => (
                    <div key={group.groupId} className="card" onClick={() => handleGroupClick(group.groupId)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <h3 style={{ margin: 0 }}>{group.groupName}</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>{group.members?.length || 0} members</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>Code: {group.groupCode}</p>
                        </div>
                      </div>
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/group/${group.groupId}`); }} style={{ flex: 1, fontSize: '13px' }}>View Tasks</button>
                        <button onClick={(e) => handleLeaveGroup(group.groupId, e)} style={{ background: 'var(--error)', color: 'white', border: 'none', fontSize: '13px' }}>Leave</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;