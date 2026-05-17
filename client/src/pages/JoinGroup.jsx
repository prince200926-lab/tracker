import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const JoinGroup = () => {
  const [groupCode, setGroupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/groups/join', { groupCode });
      setSuccess('Request sent! You will be notified when approved.');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '16px' }}>← Back</button>
      
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h1>Join Group</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>Enter the group code</p>
        
        <div className="card" style={{ padding: '20px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && <div className="error" style={{ fontSize: '14px' }}>{error}</div>}
            {success && <div className="success" style={{ fontSize: '14px' }}>{success}</div>}
            <div>
              <label style={{ fontSize: '14px' }}>Group Code</label>
              <input type="text" value={groupCode} onChange={(e) => setGroupCode(e.target.value.toUpperCase())} required style={{ width: '100%', textAlign: 'center', fontSize: '20px', letterSpacing: '4px', padding: '14px' }} />
            </div>
            <button type="submit" disabled={loading} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '14px', fontSize: '16px' }}>
              {loading ? 'Sending...' : 'Join Group'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinGroup;