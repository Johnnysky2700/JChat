import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiMoreVertical, FiShare2, FiDownload, FiTrash2, FiSend } from "react-icons/fi";

export default function StoryPage() {
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";
  const { userId } = useParams();
  const navigate = useNavigate();

  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stories?userId=${userId}`);
      const data = await res.json();
      console.log("Fetched stories for userId", userId, data); // Debug log
      const now = new Date();
      const validStories = data.filter(
        (story) => new Date(story.expiresAt) > now
      );
      setStories(validStories);
    } catch (err) {
      console.error(err);
    }
  }, [userId]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    if (!stories.length) return;

    const currentStory = stories[currentIndex];
    if (!currentStory) return;

    const fileExt = currentStory.file?.split(".").pop()?.toLowerCase();
    const isImage = !currentStory.file || ["jpg", "jpeg", "png", "gif", "webp"].includes(fileExt);

    if (isImage) {
      timerRef.current = setTimeout(() => {
        if (currentIndex < stories.length - 1) setCurrentIndex(currentIndex + 1);
        else navigate(-1);
      }, 5000);
    }

    return () => clearTimeout(timerRef.current);
  }, [currentIndex, stories, navigate]);

  const goNext = () => {
    if (currentIndex < stories.length - 1) setCurrentIndex(currentIndex + 1);
    else navigate(-1);
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  if (stories.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        No stories to show.
      </div>
    );
  }

  const currentStory = stories[currentIndex];

  const handleForward = () => {
    const contactName = prompt("Enter contact name to forward story:");
    if (contactName) {
      console.log(`Story forwarded to ${contactName}`);
      alert(`Story forwarded to ${contactName}`);
    }
    setShowMenu(false);
  };

  const handleShare = () => {
    if (navigator.share && currentStory.file) {
      navigator
        .share({
          title: "Story",
          text: currentStory.text || "Check out this story!",
          url: currentStory.file,
        })
        .catch((err) => console.error("Share failed:", err));
    } else {
      alert("Web Share not supported in this browser.");
    }
    setShowMenu(false);
  };

  const handleSave = () => {
    if (!currentStory.file) return;
    const link = document.createElement("a");
    link.href = currentStory.file;
    link.download = "story";
    link.click();
    setShowMenu(false);
  };

  const handleDelete = async () => {
    try {
      await fetch(`${API_BASE}/api/stories/${currentStory._id || currentStory.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      alert("Story deleted");
      await fetchStories();
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Failed to delete story:", err);
    }
    setShowMenu(false);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col justify-center items-center text-white">
      {/* Story area */}
      <div
        className="relative flex-grow flex items-center justify-center w-full h-full cursor-pointer rounded"
        onClick={goNext}
        style={{
          backgroundColor: !currentStory.file ? (currentStory.bgColor || "#000000") : undefined,
        }}
      >
        <div className="relative w-full h-full flex justify-center items-center">
          {currentStory.file ? (
            currentStory.file.match(/\.(mp4|webm|ogg)$/i) ? (
              <video
                src={currentStory.file}
                autoPlay
                controls={false}
                onEnded={goNext}
                className="h-full w-full object-contain rounded"
                muted
              />
            ) : (
              <img
                src={currentStory.file}
                alt="Story"
                className="h-full w-full object-contain rounded"
              />
            )
          ) : null}

          {/* Text */}
          {currentStory.text && (
            <div
              className={`absolute px-6 text-lg font-medium text-white text-center w-full ${currentStory.file ? "bottom-6" : "top-1/2 transform -translate-y-1/2"
                }`}
            >
              {currentStory.text}
            </div>
          )}
        </div>
      </div>

      {/* Menu Icon */}
      <div className="absolute top-4 right-4 text-white">
        <button onClick={() => setShowMenu(!showMenu)}>
          <FiMoreVertical className="text-2xl" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-44 bg-white text-black rounded shadow-lg z-10">
            <button
              onClick={handleForward}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
            >
              <FiSend className="text-gray-600" /> Forward
            </button>
            <button
              onClick={handleShare}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
            >
              <FiShare2 className="text-gray-600" /> Share
            </button>
            <button
              onClick={handleSave}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
            >
              <FiDownload className="text-gray-600" /> Save
            </button>
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-red-600"
            >
              <FiTrash2 className="text-red-600" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className="flex justify-between w-full max-w-md px-4 pb-6 text-2xl select-none">
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          disabled={currentIndex === 0}
        >
          ‹ Prev
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
