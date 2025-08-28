import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { authAPI } from '../../services/api';
import './ProfilePage.css';

const Avatar = ({ name }) => {
  const initial = (name || '').trim().charAt(0).toUpperCase() || 'U';
  return (
    <div className="pp-avatar">
      {initial}
    </div>
  );
};

const Card = ({ children }) => (
  <div className="pp-card">{children}</div>
);

const CardHeader = ({ title, description }) => (
  <div className="pp-card-header">
    <h3 className="pp-card-title">{title}</h3>
    {description && <p className="pp-card-desc">{description}</p>}
  </div>
);

const CardContent = ({ children }) => (
  <div className="pp-card-content">{children}</div>
);

const Input = (props) => (
  <input {...props} className={`pp-input ${props.className||''}`} />
);

const Button = ({ children, variant = 'primary', ...props }) => (
  <button {...props} className={`pp-btn ${variant === 'secondary' ? 'secondary' : 'primary'} ${props.className||''}`}>{children}</button>
);

export default function ProfilePage() {
  const { user } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setMessage('');
      const res = await authAPI.updateProfile({ name, email });
      if (res.success) {
        setMessage('Profile updated');
        setEditing(false);
      } else {
        setMessage(res.message || 'Failed to update');
      }
    } catch (e) {
      setMessage(e.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg('');
    if (!newPassword || newPassword !== confirmPassword) {
      setPwdMsg('Passwords do not match');
      return;
    }
    try {
      setPwdSaving(true);
      const res = await authAPI.changePassword('' , newPassword);
      if (res.success) {
        setPwdMsg('Password changed successfully');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdMsg(res.message || 'Failed to change password');
      }
    } catch (e) {
      setPwdMsg(e.message || 'Failed to change password');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <Card>
        <CardHeader title="Profile" description="Manage your personal information" />
        <CardContent>
          <div className="pp-row">
            <Avatar name={name || user?.username} />
            <div>
              <div className="pp-label">Username</div>
              <div className="text-base">{user?.username}</div>
            </div>
          </div>
          <div className="pp-grid">
            <div>
              <label className="pp-label">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!editing} placeholder="Your name" />
            </div>
            <div>
              <label className="pp-label">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!editing} placeholder="you@example.com" />
            </div>
          </div>
          {message && <p className="pp-msg">{message}</p>}
          <div className="pp-actions">
            {!editing ? (
              <Button onClick={() => setEditing(true)}>Edit</Button>
            ) : (
              <>
                <Button onClick={handleSaveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
                <Button variant="secondary" onClick={() => { setEditing(false); setName(user?.name||''); setEmail(user?.email||''); }}>Cancel</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Change Password" description="Update your password" />
        <CardContent>
          <form onSubmit={handleChangePassword} className="pp-form-grid">
            <div>
              <label className="pp-label">New Password</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
            </div>
            <div>
              <label className="pp-label">Confirm Password</label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" />
            </div>
            {pwdMsg && <p className={`pp-msg ${pwdMsg.includes('successfully') ? '' : 'pp-err'}`}>{pwdMsg}</p>}
            <div className="pp-form-full">
              <Button type="submit" disabled={pwdSaving}>{pwdSaving ? 'Updating...' : 'Change Password'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

