import { useState, useEffect, useRef } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { BiMenu } from "react-icons/bi";
import { RiSendPlaneFill } from "react-icons/ri";
import { FiPlus } from "react-icons/fi";
import { MdChevronLeft } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import AttachmentMenu from "./AttachmentMenu";
import PollModal from "./PollModal";
import EventModal from "./EventModal";
import { useSocket } from "../context/SocketContext";
import { useContacts } from "../ContactContext";

const API_URL = `${process.env.REACT_APP_API_BASE || "http://localhost:3000"}/api`;

export default function ChatDetails() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [contact, setContact] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const socket = useSocket();
  const { currentUser } = useContacts();
  const [isConnected, setIsConnected] = useState(socket?.connected || false);

  useEffect(() => {
    if (!socket) return;

    setIsConnected(socket.connected);

    const onConnect = () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();

  // ✅ Delete / Block / Mute actions
  const handleMenuAction = async (action) => {
    if (action === "delete") {
      if (selectedMessages.length === 0) {
        setSelectMode(true);
        return;
      }

      if (!window.confirm(`Delete ${selectedMessages.length} message(s)?`))
        return;

      try {
        await Promise.all(
          selectedMessages.map((msgId) =>
            fetch(`${API_URL}/messages/${msgId}`, {
              method: "DELETE",
            })
          )
        );
        setMessages((prev) =>
          prev.filter((msg) => !selectedMessages.includes(msg.id))
        );
        setFilteredMessages((prev) =>
          prev.filter((msg) => !selectedMessages.includes(msg.id))
        );
        setSelectedMessages([]);
        setSelectMode(false);
        setShowMenu(false);
      } catch (err) {
        console.error("Error deleting messages:", err);
      }
    } else if (action === "block") {
      alert("User blocked (mock)");
    } else if (action === "mute") {
      alert("User muted (mock)");
    }
  };

  // ✅ File input handler
  const handleFileInput = (type) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
      type === "photos"
        ? "image/*"
        : type === "document"
          ? ".pdf,.doc,.docx"
          : "";

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setAttachmentPreview({
          type: type === "photos" ? "image" : "document",
          file,
          url,
        });
      }
    };

    input.click();
  };

  const handleCamera = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setAttachmentPreview({
          type: "image",
          file,
          url,
        });
      }
    };

    input.click();
  };

  // ✅ Fetch messages from backend or from contact
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const msgRes = await fetch(`${API_URL}/messages`);
        let msgData = [];
        if (msgRes.ok) msgData = await msgRes.json();

        // Filter if /messages exists
        // We want messages where (sender == me AND contactId == them) OR (sender == them AND contactId == me)
        const myId = (currentUser?._id || currentUser?.id)?.toString();
        const contactId = (contact?._id || contact?.id || id)?.toString();

        console.log("🔍 Fetching messages logic:", { myId, contactId });

        let filtered = msgData.filter((msg) => {
          const senderId = (msg.sender?._id || msg.sender?.id || msg.sender)?.toString();
          const msgContactId = (msg.contactId?._id || msg.contactId?.id || msg.contactId)?.toString();

          const isSentByMe = senderId === myId && msgContactId === contactId;
          const isReceived = senderId === contactId && msgContactId === myId;

          return isSentByMe || isReceived;
        });

        // If filtering returns nothing, maybe the 'contactId' purely means "Conversation ID" in simple app?
        // If so, restore original if needed, but let's try this first.

        // If /messages is empty, use contact.messages (legacy)
        if (filtered.length === 0) {
          const contactRes = await fetch(`${API_URL}/users/${id}`);
          if (contactRes.ok) {
            const contactData = await contactRes.json();
            filtered = contactData.messages || [];
          }
        }

        // Sort by timestamp if available
        filtered.sort((a, b) =>
          new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
        );

        setMessages(filtered);
        setFilteredMessages(filtered);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchMessages();
  }, [id, currentUser?._id, currentUser?.id, currentUser?.externalId, contact?._id, contact?.id]);

  // ✅ Fetch contact info
  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await fetch(`${API_URL}/users/${id}`);
        const data = await res.json();
        setContact(data);
      } catch (error) {
        console.error("Failed to fetch contact:", error);
      }
    };
    fetchContact();
  }, [id]);

  // ✅ Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Search
  useEffect(() => {
    if (searchTerm.trim() !== "") {
      const filtered = messages.filter((msg) =>
        msg.text?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchTerm, messages]);

  // ✅ Send new message
  const handleSendMessage = async () => {
    if (!message.trim() && !attachmentPreview) return;

    const myId = (currentUser?._id || currentUser?.id)?.toString();
    if (!myId) {
      alert("You must be logged in to send messages");
      return;
    }

    // Recipient ID from the fetched contact if available, fallback to URL param
    const toId = (contact?._id || contact?.id || id)?.toString();

    const newMessage = {
      sender: myId,
      senderId: myId, // Mongo ID if available
      text: message,
      timestamp: new Date().toISOString(),
      contactId: toId,
      type: attachmentPreview?.type || "text",
      attachmentUrl: attachmentPreview?.url || null,
      attachmentName: attachmentPreview?.file?.name || null,
    };

    try {
      await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessage),
      });

      // Update last message safely
      fetch(`${API_URL}/users/${toId || id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          lastMessage: newMessage.text || "📎 Attachment",
        }),
      }).catch(err => console.error("Update lastMsg failed", err));

      setMessages((prev) => [...prev, newMessage]);

      // Emit socket message
      if (socket && isConnected) {
        console.log(`📡 Emitting message to ${toId}`, newMessage);
        socket.emit("send_message", {
          to: toId,
          message: newMessage,
        });
      }

      setMessage("");
      setAttachmentPreview(null);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Listen for incoming messages & Handle Join
  useEffect(() => {
    if (!socket || !currentUser) return;

    const myId = (currentUser?._id || currentUser?.id)?.toString();
    if (myId) {
      console.log(`🔌 Joining socket room: ${myId}`);
      socket.emit("join", myId);
    }

    const handleReceiveMessage = (incomingMsg) => {
      console.log("📩 Socket received message:", incomingMsg);

      const senderId = (incomingMsg.sender?._id || incomingMsg.sender?.id || incomingMsg.sender)?.toString();
      const currentContactId = (contact?._id || contact?.id || id)?.toString();

      if (senderId === currentContactId) {
        setMessages((prev) => [...prev, incomingMsg]);
      } else {
        console.log(`ℹ️ Message from ${senderId} ignored (current chat is ${currentContactId})`);
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, currentUser, contact?._id, contact?.id, id]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <MdChevronLeft
            className="text-xl cursor-pointer dark:text-white"
            onClick={() => navigate("/ChatPage")}
          />
          <div>
            <h2 className="text-base dark:text-white">
              {contact?.name || "Loading..."}
            </h2>
            <span className={`text-xs ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
              {isConnected ? 'Real-time On' : 'Connecting...'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-2xl text-black dark:text-white relative">
          <AiOutlineSearch
            className="cursor-pointer"
            onClick={() => setSearchMode((prev) => !prev)}
          />
          <BiMenu
            onClick={() => setShowMenu((prev) => !prev)}
            className="cursor-pointer"
          />
          {showMenu && (
            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border rounded shadow-md w-40 text-sm z-50">
              <button
                onClick={() => handleMenuAction("delete")}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {selectMode ? "Delete Selected" : "Delete Chat"}
              </button>
              <button
                onClick={() => handleMenuAction("block")}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Block
              </button>
              <button
                onClick={() => handleMenuAction("mute")}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Mute
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {searchMode && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded bg-white dark:bg-gray-800 text-black dark:text-white"
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {filteredMessages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`flex ${(msg.sender === "you" || (msg.sender?._id || msg.sender?.id || msg.sender)?.toString() === (currentUser?._id || currentUser?.id)?.toString()) ? "justify-end" : "justify-start"
              }`}
          >
            <div className="max-w-[75%]">
              {msg.type === "image" && (msg.attachmentUrl || msg.src) ? (
                <div className="flex flex-col">
                  <img
                    src={
                      (msg.attachmentUrl || msg.src).startsWith("http")
                        ? msg.attachmentUrl || msg.src
                        : `${process.env.REACT_APP_API_BASE || "http://localhost:3000"}${msg.attachmentUrl || msg.src}`
                    }
                    alt="media"
                    className="w-full rounded-lg"
                  />
                  {msg.text && (
                    <div
                      className={`mt-1 p-2 rounded-lg text-sm ${(msg.sender === "you" || (msg.sender?._id || msg.sender?.id || msg.sender)?.toString() === (currentUser?._id || currentUser?.id)?.toString())
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700"
                        }`}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`p-3 rounded-lg text-sm ${(msg.sender === "you" || (msg.sender?._id || msg.sender?.id || msg.sender)?.toString() === (currentUser?._id || currentUser?.id)?.toString())
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700"
                    }`}
                >
                  {msg.text}
                </div>
              )}
              <div
                className={`text-[10px] mt-1 text-right ${(msg.sender === "you" || (msg.sender?._id || msg.sender?.id || msg.sender)?.toString() === (currentUser?._id || currentUser?.id)?.toString()) ? "text-white/80" : "text-gray-500"
                  }`}
              >
                {msg.timestamp &&
                  new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {/* Image preview modal 👇 */}
      {imagePreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50"
          onClick={() => setImagePreview(null)}
        >
          <img
            src={imagePreview}
            alt="preview"
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg"
          />
        </div>
      )}
      {/* Input Area */}
      <div className="relative">
        {showAttachmentMenu && (
          <AttachmentMenu
            onSelect={(action) => {
              if (["photos", "document"].includes(action))
                handleFileInput(action);
              if (action === "camera") handleCamera();
              if (action === "poll") setShowPoll(true);
              if (action === "event") setShowEvent(true);
              setShowAttachmentMenu(false);
            }}
            onClose={() => setShowAttachmentMenu(false)}
          />
        )}

        {showPoll && (
          <PollModal
            onClose={() => setShowPoll(false)}
            onSubmit={(data) => {
              console.log("Poll:", data);
              setShowPoll(false);
            }}
          />
        )}
        {showEvent && (
          <EventModal
            onClose={() => setShowEvent(false)}
            onSubmit={(data) => {
              console.log("Event:", data);
              setShowEvent(false);
            }}
          />
        )}

        <div className="flex items-center p-4 border-t bg-white dark:bg-black dark:border-gray-700">
          <FiPlus
            size={20}
            className="mr-3 text-gray-500 cursor-pointer"
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
          />
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
            placeholder="Message"
          />
          <button
            onClick={handleSendMessage}
            className="ml-3 text-primary text-2xl"
          >
            <RiSendPlaneFill />
          </button>
        </div>
      </div>
    </div>
  );
}
