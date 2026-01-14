import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdChevronLeft } from "react-icons/md";
import Footer from './Footer';

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

export default function Chats() {
  const navigate = useNavigate();
  const [saveToPhotos, setSaveToPhotos] = useState(false);
  const [voiceTranscripts, setVoiceTranscripts] = useState(false);
  const [keepArchived, setKeepArchived] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/chatSettings`)
      .then((res) => res.json())
      .then((data) => {
        setSaveToPhotos(data.saveToPhotos);
        setVoiceTranscripts(data.voiceTranscripts);
        setKeepArchived(data.keepArchived);
      });
  }, []);

  const updateSetting = async (field, value) => {
    await fetch(`${API_BASE}/api/chatSettings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  };

  const handleToggle = (field, valueSetter, currentValue) => {
    const newValue = !currentValue;
    valueSetter(newValue);
    updateSetting(field, newValue);
  };

  const handleAction = async (action) => {
    const response = await fetch(`${API_BASE}/api/chats/${action}`, {
      method: "POST",
    });
    if (response.ok) {
      alert(`${action.replace(/-/g, " ")} completed`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-300">
      <div className=" text-black dark:bg-black dark:text-white px-4 py-6 min-h-screen">
        <div className="flex items-center justify-center mb-6 fixed top-0 left-0 w-full bg-white p-2">
          <MdChevronLeft
            onClick={() => navigate(-1)}
            className="absolute left-0 text-3xl cursor-pointer"
          />
          <h1 className="text-xl font-bold">Chats</h1>
        </div>
        <div className="space-y-6 mt-10 mb-12">
          <div
            className="bg-white dark:bg-neutral-600 p-4 rounded-lg cursor-pointer"
            onClick={() => navigate("/chat-theme")}
          >
            <p className="text-black dark:text-white">Default chat theme</p>
          </div>

          <div className="bg-white dark:bg-neutral-600 p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-black dark:text-white ">Save to Photos</p>
              <p className="text-gray-400 text-sm mt-1">
                Automatically save photos and videos you receive to Photos.
              </p>
            </div>
            <input
              type="checkbox"
              checked={saveToPhotos}
              onChange={() =>
                handleToggle("saveToPhotos", setSaveToPhotos, saveToPhotos)
              }
            />
          </div>

          <div
            className="bg-white dark:bg-neutral-600 p-4 rounded-lg cursor-pointer"
            onClick={() => navigate("/chat-backup")}
          >
            <p className="text-black dark:text-white ">Chat backup</p>
          </div>

          <div
            className="bg-white dark:bg-neutral-600 p-4 rounded-lg cursor-pointer"
            onClick={() => navigate("/export-chat")}
          >
            <p className="text-black dark:text-white ">Export chat</p>
          </div>

          <div className="bg-white dark:bg-neutral-600 p-4 rounded-lg flex justify-between items-center">
            <p className="text-black dark:text-white ">Voice message transcripts</p>
            <input
              type="checkbox"
              checked={voiceTranscripts}
              onChange={() =>
                handleToggle(
                  "voiceTranscripts",
                  setVoiceTranscripts,
                  voiceTranscripts
                )
              }
            />
          </div>

          <div className="bg-white dark:bg-neutral-600 p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-black dark:text-white ">Keep chats archived</p>
              <p className="text-gray-400 text-sm mt-1">
                Archived chats will remain archived when you receive a new
                message.
              </p>
            </div>
            <input
              type="checkbox"
              checked={keepArchived}
              onChange={() =>
                handleToggle("keepArchived", setKeepArchived, keepArchived)
              }
            />
          </div>

          <div className="bg-white dark:bg-neutral-600 p-4 rounded-lg text-green-500 space-y-4">
            <p>Move chats to Android</p>
            <p>Transfer chats to iPhone</p>
          </div>

          <div className="bg-white dark:bg-neutral-600 p-4 rounded-lg space-y-4">
            <button
              className="text-green-500"
              onClick={() => handleAction("archive-all")}
            >
              Archive all chats
            </button>{" "}
            <br />
            <button
              className="text-red-500"
              onClick={() => handleAction("clear-all")}
            >
              Clear all chats
            </button>{" "}
            <br />
            <button
              className="text-red-500"
              onClick={() => handleAction("delete-all")}
            >
              Delete all chats
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
