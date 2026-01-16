import { FiSun, FiHelpCircle, FiMail } from 'react-icons/fi';
import { RiChat3Line, RiUserLine, RiFolder3Line } from 'react-icons/ri';
import { MdNotificationsNone, MdOutlinePrivacyTip, MdChevronRight } from 'react-icons/md';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from './Footer';
import { useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export default function MorePage() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [userData, setUserData] = useState(currentUser || {});

  // Fetch fresh user info from MongoDB
  useEffect(() => {
    async function fetchUser() {
      if (!currentUser?.phone) return;

      try {
        const res = await fetch(
          `https://chat-backend-chi-virid.vercel.app/api/users/phone/${currentUser.phone}`
        );

        const data = await res.json();

        if (data) {
          setUserData(data);
          setCurrentUser(data);
          localStorage.setItem("currentUser", JSON.stringify(data));
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    }

    fetchUser();
  }, [currentUser?.phone, setCurrentUser]);

  const handleLogout = () => {
    setCurrentUser(null); // clear context
    localStorage.removeItem("currentUser"); // clear localStorage
    navigate("/VerifyPage"); // or wherever login page is
  };

  const menuItems = [
    { label: 'Account', icon: <RiUserLine />, path: '/Account' },
    { label: 'Chats', icon: <RiChat3Line />, path: '/Chats' },
    { label: 'Appearance', icon: <FiSun />, path: '/Appearance' },
    { label: 'Notification', icon: <MdNotificationsNone />, path: '/Notification' },
    { label: 'Privacy', icon: <MdOutlinePrivacyTip />, path: '/Privacy' },
    { divider: true },
    { label: 'Data Usage', icon: <RiFolder3Line />, path: '/DataUsage' },
    { label: 'Help', icon: <FiHelpCircle />, path: '/Help' },
    { label: 'Invite Your Friends', icon: <FiMail />, path: '/InviteFriends' },
  ];

  return (
    <div className={`min-h-screen flex flex-col justify-between p-4 pb-24 ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div>
        <h1 className="text-2xl font-bold mb-6 fixed top-0 left-0 w-full bg-white dark:bg-black p-2">More</h1>

        {/* Profile Section */}
        {userData && (
          <div className="flex items-center gap-4 mb-6 mt-16 cursor-pointer">
            <div
              className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
              onClick={() => setShowPreview(true)}
            >
              {userData.avatar ? (
                <img
                  src={userData.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <RiUserLine className="w-full h-full p-2 text-gray-500" />
              )}
            </div>
            <div>
              <p className="font-semibold">
                {userData.firstName && userData.lastName
                  ? `${userData.firstName} ${userData.lastName}`
                  : userData.name || "Unknown User"}
              </p>
            </div>
          </div>
        )}

        {/* Menu List */}
        <div className="space-y-6">
          {menuItems.map((item, index) =>
            item.divider ? (
              <hr key={index} className="border-t border-gray-300 dark:border-gray-600" />
            ) : (
              <div
                key={index}
                onClick={() => item.path && navigate(item.path)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-2xl">{item.icon}</span>
                  {item.label}
                </div>
                <MdChevronRight className="text-2xl" />
              </div>
            )
          )}
        </div>
      </div>

      {/* Logout Button */}
      <div className="flex justify-center mt-10">
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full text-sm"
        >
          Logout
        </button>
      </div>

      <Footer />

      {/* Avatar Preview Modal */}
      {showPreview && userData?.avatar && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <TransformWrapper
            doubleClick={{ mode: "zoomIn" }}
            wheel={{ step: 0.2 }}
            pinch={{ step: 5 }}
          >
            <TransformComponent>
              <img
                src={userData.avatar}
                alt="Avatar Preview"
                className="w-96 h-96 rounded-full"
              />
            </TransformComponent>
          </TransformWrapper>

          <button
            onClick={() => setShowPreview(false)}
            className="absolute top-4 right-4 bg-white text-black px-1 rounded"
          >
            ❌
          </button>
        </div>
      )}
    </div>
  );
}
