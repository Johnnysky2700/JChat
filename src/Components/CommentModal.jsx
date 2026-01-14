import { useState, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

export default function CommentModal({ postId, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/comments?postId=${postId}`);
        const data = await res.json();
        setComments(data);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };
    fetchComments();
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const comment = {
      postId,
      text: newComment,
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${API_BASE}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comment),
      });

      if (res.ok) {
        setComments((prev) => [...prev, comment]);
        setNewComment("");
        setShowEmoji(false);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const onEmojiClick = (emojiData) => {
    setNewComment((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-80 p-4 rounded shadow-lg relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-500 text-xl">
          ✕
        </button>

        <h2 className="text-lg font-bold mb-4">Comments</h2>

        <div className="overflow-y-auto max-h-48 mb-4">
          {comments.map((comment, index) => (
            <div key={index} className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {comment.text}
            </div>
          ))}
        </div>

        <div className="relative mb-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-2 py-1 border rounded"
            placeholder="Write a comment..."
          />
          <button
            onClick={() => setShowEmoji((prev) => !prev)}
            className="absolute right-2 top-1 text-xl"
          >
            😊
          </button>
        </div>

        {showEmoji && (
          <div className="absolute bottom-20 right-4 z-50">
            <EmojiPicker onEmojiClick={onEmojiClick} theme="light" />
          </div>
        )}

        <button
          onClick={handleAddComment}
          className="bg-blue-500 text-white px-3 py-1 rounded w-full"
        >
          Post
        </button>
      </div>
    </div>
  );
}
