import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiMoreVertical, FiShare2, FiDownload, FiTrash2, FiSend } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useContacts } from "../ContactContext";
import ForwardModal from "./ForwardModal";

export default function StoryPage() {
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { contacts } = useContacts();

  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [progress, setProgress] = useState(0);

  const fetchStories = useCallback(async () => {
    if (!userId || userId === "undefined") {
      console.warn("StoryPage: Invalid or missing userId", userId);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/stories?userId=${userId}`);
      const data = await res.json();
      console.log("Fetched stories for userId", userId, data); // Debug log
      const now = new Date();
      const validStories = data.filter(
        (story) => !story.expiresAt || new Date(story.expiresAt) > now
      );
      // Sort stories by creation time so they play in order
      validStories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setStories(validStories);
    } catch (err) {
      console.error(err);
    }
  }, [userId, API_BASE]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate(-1);
    }
  }, [currentIndex, stories.length, navigate]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (!stories.length) return;

    const currentStory = stories[currentIndex];
    if (!currentStory) return;

    setProgress(0);
    const duration = 5000; // 5 seconds per story
    const interval = 50; // Update every 50ms
    const step = (interval / duration) * 100;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          goNext();
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(progressTimer);
  }, [currentIndex, stories, goNext]);

  if (stories.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-gray-500">
        No stories to show.
      </div>
    );
  }

  const currentStory = stories[currentIndex];
  const isOwner = currentUser && (String(currentUser._id) === String(userId) || String(currentUser.id) === String(userId));

  const handleForward = async (contact) => {
    const contactId = contact._id || contact.id;
    const myId = currentUser?._id || currentUser?.id;

    const forwardMsg = {
      sender: myId,
      text: `Check out this story: ${currentStory.text || ""}`,
      timestamp: new Date().toISOString(),
      contactId: contactId,
      type: currentStory.file ? "image" : "text",
      attachmentUrl: currentStory.file || null,
    };

    try {
      await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(forwardMsg),
      });
      alert(`Forwarded to ${contact.name}`);
    } catch (err) {
      console.error("Forward failed", err);
      alert("Forward failed");
    }
    setShowForwardModal(false);
  };

  const handleShare = async () => {
    const shareData = {
      title: "JChat Story",
      text: currentStory.text || "Check out this story!",
      url: currentStory.file || window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard!");
      } catch (err) {
        alert("Sharing not supported in this browser.");
      }
    }
    setShowMenu(false);
  };

  const handleSave = async () => {
    if (!currentStory.file) return;
    try {
      const response = await fetch(currentStory.file);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `story-${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Save failed", err);
      // Fallback to direct link
      const link = document.createElement("a");
      link.href = currentStory.file;
      link.download = "story";
      link.click();
    }
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this story?")) return;
    try {
      await fetch(`${API_BASE}/api/stories/${currentStory._id || currentStory.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      alert("Story deleted");
      if (stories.length === 1) {
        navigate(-1);
      } else {
        const nextIndex = currentIndex === stories.length - 1 ? currentIndex - 1 : currentIndex;
        await fetchStories();
        setCurrentIndex(nextIndex);
      }
    } catch (err) {
      console.error("Failed to delete story:", err);
    }
    setShowMenu(false);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col justify-center items-center text-white z-50">
      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
        {stories.map((_, idx) => (
          <div key={idx} className="h-1 flex-grow bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-50 linear"
              style={{
                width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Story area */}
      <div
        className="relative flex-grow flex items-center justify-center w-full h-full cursor-pointer"
        onClick={(e) => {
          const { clientX } = e;
          const { innerWidth } = window;
          if (clientX < innerWidth / 3) goPrev();
          else goNext();
        }}
        style={{
          backgroundColor: !currentStory.file ? (currentStory.bgColor || "#1E1E1E") : undefined,
        }}
      >
        <div className="relative w-full h-full flex justify-center items-center">
          {currentStory.file ? (
            currentStory.file.match(/\.(mp4|webm|ogg)$/i) ? (
              <video
                src={currentStory.file}
                autoPlay
                playsInline
                controls={false}
                className="h-full w-full object-contain"
                muted
              />
            ) : (
              <img
                src={currentStory.file}
                alt="Story"
                className="h-full w-full object-contain"
              />
            )
          ) : null}

          {/* Text */}
          {currentStory.text && (
            <div
              className={`absolute px-6 text-xl font-semibold text-white text-center w-full drop-shadow-lg ${currentStory.file ? "bottom-20" : "top-1/2 transform -translate-y-1/2"
                }`}
            >
              {currentStory.text}
            </div>
          )}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-8 right-14 z-50 p-2 bg-black/20 rounded-full hover:bg-black/40 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Menu Icon */}
      <div className="absolute top-8 right-4 text-white z-50">
        <button onClick={() => setShowMenu(!showMenu)} className="p-2 bg-black/20 rounded-full">
          <FiMoreVertical className="text-2xl" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-xl shadow-2xl z-[60] overflow-hidden">
            <button
              onClick={() => { setShowForwardModal(true); setShowMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100"
            >
              <FiSend className="text-gray-600" /> <span className="text-sm font-medium">Forward</span>
            </button>
            <button
              onClick={handleShare}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100"
            >
              <FiShare2 className="text-gray-600" /> <span className="text-sm font-medium">Share</span>
            </button>
            {currentStory.file && (
              <button
                onClick={handleSave}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100"
              >
                <FiDownload className="text-gray-600" /> <span className="text-sm font-medium">Save</span>
              </button>
            )}
            {isOwner && (
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors text-red-600"
              >
                <FiTrash2 className="text-red-600" /> <span className="text-sm font-medium">Delete</span>
              </button>
            )}
          </div>
        )}
      </div>

      {showForwardModal && (
        <ForwardModal
          contacts={contacts}
          onClose={() => setShowForwardModal(false)}
          onForward={handleForward}
        />
      )}
    </div>
  );
}
