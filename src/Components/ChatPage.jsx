import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useContacts } from "../ContactContext";
import { FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { CgPlayListCheck } from "react-icons/cg";
import { RiChatNewLine } from "react-icons/ri";
import Footer from "./Footer";
import StoryBar from "./StoryBar";
import StoryModal from "./StoryModal";

const API_URL = "http://localhost:3000/api";

export default function ChatPage() {
  const { contacts, setContacts, currentUser } = useContacts();
  const [selectedChats, setSelectedChats] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [showFullModal, setShowFullModal] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [storyFile, setStoryFile] = useState(null);
  const [modalSearch, setModalSearch] = useState("");
  // ✅ ADDED missing state

  const navigate = useNavigate();
  const currentUserId = currentUser?.id || "user-123";

  const [stories, setStories] = useState([]);

  // Move fetchStories outside useEffect so it can be reused
  const fetchStories = useCallback(async () => {
    const res = await fetch(`${API_URL}/stories`);
    const data = await res.json();
    console.log("Fetched stories:", data); // Log all fetched stories
    const now = new Date();
    const valid = data
      .filter((story) => new Date(story.expiresAt) > now)
      .map((s) => {
        // Only set userId if it exists, otherwise log a warning
        if (!s.userId) {
          console.warn("Story missing userId:", s);
        }
        return s.userId ? { ...s, userId: s.userId } : null;
      })
      .filter(Boolean);
    setStories(valid);
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      const data = await res.json();
      setContacts(data);
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
    }
  }, [setContacts]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const toggleChatSelection = (id) => {
    setSelectedChats((prev) =>
      prev.includes(id) ? prev.filter((chatId) => chatId !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    try {
      await Promise.all(
        selectedChats.map((id) =>
          fetch(`${API_URL}/users/${id}`, { method: "DELETE" })
        )
      );
      fetchContacts();
      setSelectedChats([]);
      setSelectMode(false);
    } catch (err) {
      console.error("Failed to delete contacts:", err);
    }
  };

  const handleUploadStory = async () => {
    if (!storyText && !storyFile) {
      alert("Please add text or select a file.");
      return;
    }

    const newStory = {
      userId: currentUserId,
      text: storyText,
      file: storyFile ? URL.createObjectURL(storyFile) : null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    try {
      const response = await fetch(`${API_URL}/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStory),
      });
      console.log("Posted story:", newStory); // Log posted story
      if (!response.ok) throw new Error("Upload failed");

      alert("Story uploaded!");
      setShowFullModal(false);
      setStoryText("");
      setStoryFile(null);
    } catch (err) {
      console.error(err);
      alert("Failed to upload story");
    }
  };

  const previewUrl = useMemo(() => {
    if (!storyFile) return null;
    return URL.createObjectURL(storyFile);
  }, [storyFile]);

  // ✅ Revoke preview URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.lastMessage &&
      (contact.name || "Unknown").toLowerCase().includes(search.toLowerCase())
  );

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectChats = () => {
    setSelectMode(!selectMode);
    setShowMenu(false);
  };

  const handleGoToNewsFeed = () => {
    navigate("/NewsFeed");
    setShowMenu(false);
  };

  return (
    <div className="min-h-screen bg-white p-4 pb-24 text-black dark:bg-black dark:text-white relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 py-4">
        <h1 className="text-xl font-semibold">Chats</h1>
        <div className="flex items-center space-x-2 text-xl">
          <button onClick={() => setShowModal(true)} aria-label="New chat">
            <RiChatNewLine />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Toggle menu"
            >
              <CgPlayListCheck className="text-2xl mt-2" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 w-40 bg-white dark:bg-gray-800 shadow-lg border rounded z-50">
                <button
                  onClick={handleSelectChats}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  {selectMode ? "Cancel Selection" : "Select Chats"}
                </button>
                <button
                  onClick={handleGoToNewsFeed}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  Go to NewsFeed
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Story bar */}
      <StoryBar
        currentUser={currentUser}
        contacts={contacts}
        setShowFullModal={setShowFullModal}
        stories={stories}
      />

      {showFullModal && (
        <StoryModal
          currentUser={currentUser}
          onClose={() => setShowFullModal(false)}
          onStoryUpload={() => {
            setStoryText("");
            setStoryFile(null);
            fetchStories(); // Refresh stories after upload
          }}
        />
      )}
      {/* Bulk delete */}
      {selectMode && selectedChats.length > 0 && (
        <div className="fixed bottom-16 left-4 right-4 z-40 flex justify-around items-center py-2 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
          <button onClick={handleDelete} className="text-sm text-red-600">
            Delete
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search chats"
          className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-md"
        />
        <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
      </div>

      {/* Contact list */}
      <ul>
        {filteredContacts.map((contact) => (
          <li
            key={contact._id ?? contact.id}
            className="flex items-center justify-between py-4 border-b transition hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <div
              className="flex gap-3 items-center cursor-pointer w-full"
              onClick={() => {
                const contactId = contact._id ?? contact.id;
                selectMode
                  ? toggleChatSelection(contactId)
                  : navigate(`/ChatDetails/${contactId}`)
              }}
            >
              {selectMode && (
                <input
                  type="checkbox"
                  checked={selectedChats.includes(contact._id ?? contact.id)}
                  onChange={() => toggleChatSelection(contact._id ?? contact.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <div className="relative">
                {contact.avatar ? (
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="rounded-xl object-cover w-12 h-12"
                  />
                ) : (
                  <div className="bg-blue-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-semibold">
                    {contact.initials}
                  </div>
                )}
                {/* Name Overlay requested by user */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center px-1 truncate rounded-b-xl">
                  {contact.name?.split(" ")[0]}
                </div>
              </div>
              <div>
                <p className="font-medium">{contact.name}</p>
                <p className="text-gray-400 text-sm">
                  {contact.lastMessage || "Started chat"}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Footer />

      {/* Upload Story Modal */}
      {showFullModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-80 text-black dark:text-white relative">
            <button
              onClick={() => {
                setShowFullModal(false);
                setStoryFile(null);
                setStoryText("");
              }}
              className="absolute top-2 right-3 text-gray-400 hover:text-white"
            >
              ×
            </button>

            <h2 className="text-lg font-semibold mb-4">Add New Story</h2>

            <div className="relative mb-3">
              <textarea
                placeholder="Say something..."
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                className="w-full p-2 pl-10 rounded border dark:bg-gray-800 dark:border-gray-600"
              />
              <span className="absolute left-3 top-2.5 text-xl text-gray-400">
                💬
              </span>
            </div>

            {previewUrl && (
              <div className="mb-4 relative w-full max-h-48 rounded overflow-hidden">
                {storyFile?.type?.startsWith("image/") ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded"
                  />
                ) : storyFile?.type?.startsWith("video/") ? (
                  <video
                    controls
                    src={previewUrl}
                    className="w-full h-48 object-cover rounded"
                  />
                ) : null}
                {storyText && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-sm p-1 text-center">
                    {storyText}
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center justify-center">
              <label className="cursor-pointer text-3xl">
                📷
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setStoryFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

            <button
              className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              onClick={handleUploadStory}
              disabled={!storyText && !storyFile}
            >
              Upload
            </button>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-96 max-h-[90vh] overflow-hidden text-black dark:text-white">
            <h2 className="text-lg font-semibold mb-2">Start New Chat</h2>
            <input
              type="text"
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              placeholder="Search contacts"
              className="w-full px-3 py-2 mb-3 bg-gray-100 dark:bg-gray-800 rounded-md"
            />

            <ul className="overflow-y-auto max-h-[60vh] pr-2">
              {contacts
                .filter((c) =>
                  (c.name || "")
                    .toLowerCase()
                    .includes(modalSearch.toLowerCase())
                )
                .map((contact) => (
                  <li
                    key={contact._id ?? contact.id}
                    className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    onClick={async () => {
                      const contactId = contact._id ?? contact.id;
                      try {
                        const res = await fetch(
                          `${API_URL}/messages?contactId=${contactId}`
                        );
                        const messages = await res.json();
                        const lastMsgText = messages.length
                          ? messages[messages.length - 1].text
                          : "";

                        await fetch(
                          `${API_URL}/users/${contactId}`,
                          {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${localStorage.getItem("token")}`,
                            },
                            body: JSON.stringify({
                              lastMessage: lastMsgText,
                            }),
                          }
                        );

                        await fetchContacts();
                        setShowModal(false);
                        navigate(`/ChatDetails/${contactId}`);
                      } catch (err) {
                        console.error("Failed to start chat:", err);
                      }
                    }}
                  >
                    {contact.avatar ? (
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-500 text-white rounded-2xl flex items-center justify-center text-sm font-semibold">
                        {contact.initials}
                      </div>
                    )}
                    <div>
                      <p>{contact.name}</p>
                      <p className="text-xs text-gray-400">{contact.phone}</p>
                    </div>
                  </li>
                ))}
            </ul>

            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
