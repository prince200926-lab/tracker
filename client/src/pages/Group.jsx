import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import socket from '../services/socket';

const Group = () => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ subject: '', chapter: '', lectureNo: '', description: '', deadline: '' });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.userId) {
      socket.setUserId(user.userId);
      socket.connect();
    }
  }, [user]);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const [groupRes, tasksRes] = await Promise.all([
          api.get(`/groups/${groupId}`),
          api.get(`/tasks/group/${groupId}`)
        ]);
        setGroup(groupRes.data);
        setTasks(tasksRes.data);
        socket.joinGroupRoom(groupId);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load group data');
        setLoading(false);
      }
    };
    if (user && groupId) {
      socket.connect();
      fetchGroupData();
    }
  }, [user, groupId]);

  useEffect(() => {
    const handleTaskUpdated = (data) => {
      setTasks(prev => prev.map(t => t.taskId === data.taskId ? { ...t, completionStatus: { ...t.completionStatus, [data.userId]: data.completed } } : t));
    };
    const handleTaskCreated = (newTask) => setTasks(prev => [newTask, ...prev]);
    const handleTaskDeleted = (data) => {
      setTasks(prev => prev.filter(t => t.taskId !== data.taskId));
    };
    const handleMemberJoined = () => {
      api.get(`/groups/${groupId}`).then(r => setGroup(r.data)).catch(console.error);
    };
    const handleJoinRequestReceived = () => {
      api.get(`/groups/${groupId}`).then(r => setGroup(r.data)).catch(console.error);
    };

    socket.on('task-updated', handleTaskUpdated);
    socket.on('task-created', handleTaskCreated);
    socket.on('task-deleted', handleTaskDeleted);
    socket.on('member-joined', handleMemberJoined);
    socket.on('join-request-received', handleJoinRequestReceived);
    
    return () => {
      socket.off('task-updated', handleTaskUpdated);
      socket.off('task-created', handleTaskCreated);
      socket.off('task-deleted', handleTaskDeleted);
      socket.off('member-joined', handleMemberJoined);
      socket.off('join-request-received', handleJoinRequestReceived);
    };
  }, [groupId]);

  const handleBack = () => navigate('/dashboard');

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks/create', { groupId, ...newTask });
      setShowTaskModal(false);
      setNewTask({ subject: '', chapter: '', lectureNo: '', description: '', deadline: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleTaskComplete = async (taskId, completed) => {
    try {
      await api.post('/tasks/mark-complete', { taskId, completed });
      socket.markTaskComplete(taskId, completed, groupId);
      setTasks(prev => prev.map(t => t.taskId === taskId ? { ...t, completionStatus: { ...t.completionStatus, [user.userId]: completed } } : t));
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleJoinRequest = async (userId, action) => {
    try {
      await api.post('/groups/respond-request', { groupId, userId, action });
      socket.respondToJoinRequest(groupId, userId, action === 'accept');
      const res = await api.get(`/groups/${groupId}`);
      setGroup(res.data);
    } catch (err) {
      console.error('Error responding to request:', err);
    }
  };

  if (!user) return <div style={{ padding: '24px' }}>Please log in</div>;
  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;
  if (error) return <div style={{ padding: '24px' }}><p className="error">{error}</p><button onClick={handleBack}>Back</button></div>;
  if (!group) return <div style={{ padding: '24px' }}><p>Group not found</p><button onClick={handleBack}>Back to Dashboard</button></div>;

  const isLeader = user.userId === group.leaderId;
  const completedCount = (status) => Object.values(status || {}).filter(Boolean).length;
  const totalCount = (status) => Object.keys(status || {}).length;

  return (
    <div style={{ padding: '16px' }}>
      <header style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ flex: '1 1 200px' }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{group.groupName}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Code: {group.groupCode}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handleBack} style={{ fontSize: '13px' }}>Back</button>
          <button onClick={() => setShowTaskModal(true)} style={{ background: 'var(--accent)', color: 'white', border: 'none', fontSize: '13px' }}>Add Task</button>
        </div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ textAlign: 'center' }}>Tasks</h2>
          {tasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No tasks yet</p>
              <button onClick={() => setShowTaskModal(true)} style={{ marginTop: '12px', background: 'var(--accent)', color: 'white', border: 'none' }}>Add Task</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tasks.map(task => {
                const done = completedCount(task.completionStatus);
                const total = totalCount(task.completionStatus);
                const myDone = task.completionStatus?.[user.userId];
                const isCreator = task.createdBy === user.userId;
                return (
                  <div key={task.taskId} className="card" style={{ opacity: myDone ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 4px', textDecoration: myDone ? 'line-through' : 'none' }}>{task.subject}</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Ch {task.chapter}, Lec {task.lectureNo}</p>
                          <p style={{ color: 'var(--accent)', fontSize: '12px' }}>Added by {task.createdByName || task.createdBy}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{done}/{total}</span>
                          <input type="checkbox" checked={myDone || false} onChange={(e) => handleTaskComplete(task.taskId, e.target.checked)} style={{ width: '20px', height: '20px' }} />
                        </div>
                      </div>
                      {task.description && <p style={{ fontSize: '14px' }}>{task.description}</p>}
                      {task.deadline && <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Due: {new Date(task.deadline).toLocaleDateString()}</p>}
                      {isCreator && (
                        <button onClick={(e) => handleDeleteTask(task.taskId, e)} style={{ background: 'var(--error)', color: 'white', border: 'none', fontSize: '12px', padding: '6px 12px', alignSelf: 'flex-start', marginTop: '8px' }}>
                          Delete Task
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 style={{ textAlign: 'center' }}>Members ({group.members?.length || 0})</h2>
          <div className="card">
            {group.members?.map(member => (
              <div key={member.userId || member} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <span style={{ fontSize: '14px' }}>{member.displayName || member.username || member.userId || member}</span>
                {(member.userId || member) === group.leaderId && <span style={{ background: 'var(--accent)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>Leader</span>}
              </div>
            ))}
          </div>

          {isLeader && group.pendingRequests?.length > 0 && (
            <>
              <h2 style={{ marginTop: '24px' }}>Pending Requests</h2>
              <div className="card">
                {group.pendingRequests.map(req => (
                  <div key={req.userId} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <p>{req.username || req.userId}</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button onClick={() => handleJoinRequest(req.userId, 'accept')} style={{ background: 'var(--success)', color: 'white', border: 'none', fontSize: '12px' }}>Accept</button>
                      <button onClick={() => handleJoinRequest(req.userId, 'reject')} style={{ background: 'var(--error)', color: 'white', border: 'none', fontSize: '12px' }}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {showTaskModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>Create Task</h2>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={{ fontSize: '14px' }}>Subject</label><input type="text" value={newTask.subject} onChange={e => setNewTask({...newTask, subject: e.target.value})} required style={{ width: '100%', fontSize: '16px' }} /></div>
              <div><label style={{ fontSize: '14px' }}>Chapter</label><input type="text" value={newTask.chapter} onChange={e => setNewTask({...newTask, chapter: e.target.value})} required style={{ width: '100%', fontSize: '16px' }} /></div>
              <div><label style={{ fontSize: '14px' }}>Lecture No</label><input type="text" value={newTask.lectureNo} onChange={e => setNewTask({...newTask, lectureNo: e.target.value})} required style={{ width: '100%', fontSize: '16px' }} /></div>
              <div><label style={{ fontSize: '14px' }}>Description</label><textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} style={{ width: '100%', minHeight: '80px', fontSize: '16px' }} /></div>
              <div><label style={{ fontSize: '14px' }}>Deadline</label><input type="date" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} style={{ width: '100%', fontSize: '16px' }} /></div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" style={{ background: 'var(--accent)', color: 'white', border: 'none', flex: 1 }}>Create</button>
                <button type="button" onClick={() => setShowTaskModal(false)} style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Group;