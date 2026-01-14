import { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current user from localStorage and then refresh from backend
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

      // Fetch fresh data from backend to get latest edits
      fetch(`${API_BASE}/api/users?email=${parsedUser.email}`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
        .then((res) => {
          if (res.status === 401) throw new Error("Unauthorized");
          return res.json();
        })
        .then((data) => {
          if (data && data.length > 0) {
            setCurrentUser(data[0]);
            localStorage.setItem('currentUser', JSON.stringify(data[0]));
          } else {
            setCurrentUser(parsedUser);
          }
        })
        .catch(() => {
          // If auth fails, logout
          logout();
        });
    }
  }, []);

  // Login using data from OTP flow
  const login = async (userData, token) => {
    try {
      setCurrentUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      if (token) {
        localStorage.setItem('token', token);
      }
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
