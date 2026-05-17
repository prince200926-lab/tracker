import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, error } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <button onClick={toggleTheme} style={{ position: 'absolute', top: '12px', right: '12px', padding: '8px' }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Join your study groups</p>
        </div>
        
        <div className="card" style={{ padding: '20px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && <div className="error" style={{ fontSize: '14px' }}>{error}</div>}
            <div>
              <label style={{ fontSize: '14px' }}>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', fontSize: '16px', padding: '12px' }} />
            </div>
            <div>
              <label style={{ fontSize: '14px' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', fontSize: '16px', padding: '12px' }} />
            </div>
            <div>
              <label style={{ fontSize: '14px' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', fontSize: '16px', padding: '12px' }} />
            </div>
            <button type="submit" disabled={loading} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '14px', fontSize: '16px' }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '14px' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;