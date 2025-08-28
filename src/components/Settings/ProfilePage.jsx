import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { authAPI } from '../../services/api';

const Avatar = ({ name }) => {
  const initial = (name || '').trim().charAt(0).toUpperCase() || 'U';
  return (
    <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-semibold">
      {initial}
    </div>
  );
};

const Card = ({ children }) => (
  <div className="bg-white dark:bg-[var(--background-elevated)] border border-[var(--border-primary)] rounded-xl shadow-sm">
    {children}
  </div>
);

const CardHeader = ({ title, description }) => (
  <div className="p-6 border-b border-[var(--border-primary)]">
    <h3 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h3>
    {description && <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>}
  </div>
);

const CardContent = ({ children }) => (
  <div className="p-6">{children}</div>
);

const Input = (props) => (
  <input {...props} className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[var(--input-bg)] border-[var(--border-primary)] ${props.className||''}`} />
);

const Button = ({ children, variant = 'primary', ...props }) => {
  const base = 'inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors';
  const styles = variant === 'secondary' ? 'bg-[var(--background-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:bg-[var(--background-tertiary)]' : 'bg-blue-600 text-white hover:bg-blue-700';
  return (
    <button {...props} className={`${base} ${styles} ${props.className||''}`}>{children}</button>
  );
};

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
    <div className="space-y-6">
      <Card>
        <CardHeader title="Profile" description="Manage your personal information" />
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar name={name || user?.username} />
            <div>
              <div className="text-sm text-[var(--text-secondary)]">Username</div>
              <div className="text-lg text-[var(--text-primary)] font-medium">{user?.username}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!editing} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!editing} placeholder="you@example.com" />
            </div>
          </div>
          {message && <p className="text-sm text-green-600 mt-3">{message}</p>}
          <div className="mt-6 flex gap-3">
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
          <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">New Password</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Confirm Password</label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" />
            </div>
            {pwdMsg && <p className="text-sm col-span-full mt-1 {pwdMsg.includes('successfully') ? 'text-green-600' : 'text-red-600'}">{pwdMsg}</p>}
            <div className="col-span-full">
              <Button type="submit" disabled={pwdSaving}>{pwdSaving ? 'Updating...' : 'Change Password'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

