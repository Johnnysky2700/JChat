import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdChevronLeft, MdEdit } from 'react-icons/md';
import imageCompression from 'browser-image-compression';
import { useAuth } from '../context/AuthContext';
import Footer from './Footer';

export default function Account() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAuth();

  const [user, setUser] = useState(currentUser || {});
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [loading, setLoading] = useState(true);

  // Fetch latest user info from MongoDB on mount
  useEffect(() => {
    async function fetchUser() {
      const storedUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!storedUser?._id && !storedUser?.id) {
        setLoading(false);
        return;
      }
      const id = storedUser._id || storedUser.id;

      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE}/api/users/${id}`);
        const data = await res.json();

        if (res.ok && data) {
          setUser(data);
          setAvatar(data.avatar || null);
          setCurrentUser(data);
          localStorage.setItem('currentUser', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [setCurrentUser]);

  // Handle input changes and auto-sync to AuthContext & localStorage
  const handleChange = async (e) => {
    const { name, value } = e.target;
    const updatedUser = { ...user, [name]: value };
    setUser(updatedUser);

    // Optimistically update AuthContext and localStorage
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    // Auto-save to backend
    if (user._id || user.id) {
      const id = user._id || user.id;
      try {
        await fetch(`${process.env.REACT_APP_API_BASE}/api/users/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(updatedUser),
        });
      } catch (err) {
        console.error('Failed to auto-save user:', err);
      }
    }
  };

  // Handle avatar change
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 300,
        useWebWorker: true,
      });

      const base64 = await imageCompression.getDataUrlFromFile(compressedFile);

      const updatedUser = { ...user, avatar: base64 };
      setAvatar(base64);
      setUser(updatedUser);

      // Update AuthContext and localStorage
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      // Save to backend
      if (user._id || user.id) {
        const id = user._id || user.id;
        await fetch(`${process.env.REACT_APP_API_BASE}/api/users/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(updatedUser),
        });
      }
    } catch (error) {
      console.error('Image compression failed:', error);
      alert('Failed to process avatar image.');
    }
  };

  const handleSave = async () => {
    if (!user._id && !user.id) {
      alert('User not logged in. Please login again.');
      return;
    }

    const id = user._id || user.id;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE}/api/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(user),
      });

      const updatedUser = await res.json();

      if (!res.ok) {
        alert(updatedUser.error || 'Error saving user info');
        return;
      }

      setUser(updatedUser);
      setAvatar(updatedUser.avatar);
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      alert('Account info saved!');
      navigate('/MorePage');
    } catch (err) {
      console.error(err);
      alert('Error saving user info');
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="min-h-screen p-6 bg-white text-black dark:bg-black dark:text-white pb-24">
      <div className="flex items-center gap-3 fixed w-full left-0 top-0 p-2 bg-white dark:bg-black z-20">
        <MdChevronLeft
          className="text-2xl cursor-pointer mb-6"
          onClick={() => navigate('/MorePage')}
        />
        <h1 className="text-2xl font-bold mb-6">Edit Account</h1>
      </div>

      <div className="relative w-24 h-24 mx-auto mb-6 mt-16">
        <img
          src={avatar || '/default-avatar.png'}
          alt="Avatar"
          className="w-full h-full object-cover rounded-full border-2 border-gray-300 dark:border-gray-600"
        />
        <label className="absolute bottom-0 right-0 bg-gray-200 p-1 rounded-full cursor-pointer dark:bg-gray-700">
          <MdEdit className="text-black dark:text-white" />
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </label>
      </div>

      <div className="space-y-5">
        {['firstName', 'lastName', 'email', 'phone', 'address', 'country'].map((field) => (
          <div key={field}>
            <label className="block font-medium capitalize mb-1" htmlFor={field}>
              {field === 'email' ? 'Gmail' : field}
            </label>
            <input
              id={field}
              name={field}
              type="text"
              value={user[field] || ''}
              onChange={handleChange}
              className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white"
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Save
        </button>
      </div>

      <Footer />
    </div>
  );
}
