import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CreateGroup = () => {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/groups/create', { groupName });
      navigate(`/group/${response.data.groupId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '16px' }}>← Back</button>
      
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h1>Create Group</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>Start a new study group</p>
        
        <div className="card" style={{ padding: '20px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && <div className="error" style={{ fontSize: '14px' }}>{error}</div>}
            <div>
              <label style={{ fontSize: '14px' }}>Group Name</label>
              <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} required style={{ width: '100%', fontSize: '16px', padding: '12px' }} />
            </div>
            <button type="submit" disabled={loading} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '14px', fontSize: '16px' }}>
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;