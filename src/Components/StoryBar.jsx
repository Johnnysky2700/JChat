import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import StoryModal from "./StoryModal"; // Make sure this path is correct

export default function StoryBar({ currentUser, contacts, stories, onStoryUpload }) {
  console.log("StoryBar received stories:", stories); // Debug log
  console.log("StoryBar currentUser:", currentUser);
  console.log("StoryBar contacts count:", contacts?.length);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  // Find the current user's latest story
  let currentUserStory = null;
  if (currentUser && (currentUser.id || currentUser._id)) {
    const currentUserId = (currentUser.id || currentUser._id).toString();
    const userStories = stories.filter(
      (s) => s.userId?.toString() === currentUserId
    );
    if (userStories.length) {
      currentUserStory = userStories.reduce((a, b) =>
        new Date(a.createdAt) > new Date(b.createdAt) ? a : b
      );
    }
  }

  const latestStoryByUser = contacts
    .map((contact) => {
      const contactId = contact._id || contact.id;
      const userStories = stories.filter(
        (s) =>
          s.userId?.toString() === contactId?.toString() ||
          s.contactId?.toString() === contactId?.toString()
      );
      if (!userStories.length) return null;
      const latest = userStories.reduce((a, b) =>
        new Date(a.createdAt) > new Date(b.createdAt) ? a : b
      );
      return { ...latest, contact };
    })
    .filter(Boolean);

  return (
    <>
      {/* Story modal */}
      {showModal && (
        <StoryModal
          currentUser={currentUser}
          onClose={() => setShowModal(false)}
          onStoryUpload={() => {
            setShowModal(false);
            onStoryUpload && onStoryUpload();
          }}
        />
      )}

      {/* Story bar */}
      <div className="flex space-x-4 overflow-x-auto py-3 px-1 mb-4">
        {/* Current user's "Add Story" */}
        <div
          onClick={() => setShowModal(true)}
          className="flex flex-col items-center cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-green-500 text-white flex items-center justify-center font-bold text-2xl">
            +
          </div>
          <p className="text-xs mt-1">Your Story</p>
        </div>

        {/* Current user's latest story (if any) */}
        {currentUserStory && (
          <div
            key={currentUserStory.id}
            onClick={() => navigate(`/story/${currentUser.id}`)}
            className="flex flex-col items-center cursor-pointer"
          >
            <div className="relative">
              {currentUserStory.file && currentUserStory.file.match(/\.(mp4|webm|ogg)$/i) ? (
                <video
                  src={currentUserStory.file}
                  className="w-14 h-14 object-cover rounded-2xl border-2 border-blue-500"
                  muted
                />
              ) : (
                <img
                  src={currentUserStory.file || currentUser.avatar}
                  alt={currentUser.name || "Your Story"}
                  className="w-14 h-14 object-cover rounded-2xl border-2 border-blue-500"
                />
              )}
              <span className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-[10px] px-1 rounded">
                {formatDistanceToNow(new Date(currentUserStory.createdAt), { addSuffix: false })}
              </span>
            </div>
            <p className="text-xs mt-1 truncate w-16 text-center select-none">
              {(currentUser?.name || "You").split(" ")[0]}
            </p>
          </div>
        )}

        {/* Contacts' latest stories */}
        {latestStoryByUser.map((story) => (
          <div
            key={story.id}
            onClick={() => navigate(`/story/${story.contact.id}`)}
            className="flex flex-col items-center cursor-pointer"
          >
            <div className="relative">
              {story.file && story.file.match(/\.(mp4|webm|ogg)$/i) ? (
                <video
                  src={story.file}
                  className="w-14 h-14 object-cover rounded-2xl border-2 border-blue-500"
                  muted
                />
              ) : (
                <img
                  src={story.file || story.contact.avatar}
                  alt={story.contact.name}
                  className="w-14 h-14 object-cover rounded-2xl border-2 border-blue-500"
                />
              )}
              <span className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-[10px] px-1 rounded">
                {formatDistanceToNow(new Date(story.createdAt), { addSuffix: false })}
              </span>
            </div>
            <p className="text-xs mt-1 truncate w-16 text-center select-none">
              {(story.contact.name || "Unknown").split(" ")[0]}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}