import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import StoryBar from "./NewsStoryBar";
import CommentModal from "./CommentModal";
import CreatePostModal from "./CreatePostModal";
import {
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineComment,
  AiOutlineSave,
  AiFillSave,
} from "react-icons/ai";
import { FiPlus } from "react-icons/fi";
import { MdChevronLeft } from "react-icons/md";

export default function NewsFeed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [userFilter, setUserFilter] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [friendPostsOnly, setFriendPostsOnly] = useState(false); // ✅ Filter flag
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // ✅ Get current user info from localStorage and fetch from backend
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("currentUser"));
    if (stored?.id) {
      const id = stored._id || stored.id;
      fetch(`${process.env.REACT_APP_API_BASE}/api/users/${id}`)
        .then((res) => res.json())
        .then((data) => setCurrentUser(data))
        .catch((err) => console.error("Failed to fetch user:", err));
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      let url = `${process.env.REACT_APP_API_BASE}/api/posts?_page=${page}&_limit=5`;
      if (friendPostsOnly && currentUser?.friends) {
        const friendsFilter = currentUser.friends.join(",");
        url += `&userId=${friendsFilter}`;
      } else if (userFilter) {
        url += `&userId=${userFilter}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.length > 0) {
        setPosts((prev) => [...prev, ...data]);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  }, [page, userFilter, friendPostsOnly, currentUser]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 10 && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore]);

  useEffect(() => {
    const ref = containerRef.current;
    if (ref) {
      ref.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (ref) ref.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  const handleDoubleTap = async (postId) => {
    if (!likedPosts.includes(postId)) {
      setLikedPosts([...likedPosts, postId]);
      await fetch(`${process.env.REACT_APP_API_BASE}/api/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ liked: true }),
      });
    }
  };

  const toggleSave = async (postId) => {
    const isSaved = savedPosts.includes(postId);
    const updated = isSaved
      ? savedPosts.filter((id) => id !== postId)
      : [...savedPosts, postId];

    setSavedPosts(updated);
    await fetch(`${process.env.REACT_APP_API_BASE}/api/posts/${postId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ saved: !isSaved }),
    });
  };

  const handleCommentClick = (post) => {
    setSelectedPost(post);
    setShowCommentModal(true);
  };

  const handleFilterByUser = (userId) => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setUserFilter(userId);
  };

  const renderMedia = (post) => {
    if (post.type === "video") {
      return (
        <video
          src={post.mediaUrl}
          className="w-full rounded-lg"
          controls
          autoPlay
          muted
          loop
        />
      );
    }
    return (
      <div className="relative">
        <img
          src={post.mediaUrl}
          alt="post"
          className="w-full rounded-lg filter brightness-95 saturate-110"
        />
      </div>
    );
  };

  return (
    <div
      className="h-screen overflow-y-auto bg-white dark:bg-black"
      ref={containerRef}
    >
      {/* Current User Header */}
      {currentUser && (
        <div className="flex items-center gap-3 p-4 border-b dark:border-gray-700 bg-white dark:bg-black overflow-x-auto">
          <MdChevronLeft
            onClick={() => navigate(-1)}
            className="text-3xl cursor-pointer"
          />
          <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden">
            <img
              src={currentUser.avatar || "/default-avatar.png"}
              alt="profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-bold dark:text-white">{`${currentUser.firstName} ${currentUser.lastName}`}</p>
            <p className="text-xs text-gray-500">{currentUser.email}</p>
          </div>
        </div>
      )}

      {/* Stories */}
      <div className="p-3 border-b dark:border-gray-700">
        <StoryBar />
      </div>

      {/* Toggle Friend Posts */}
      <div className="p-3">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="form-checkbox text-blue-600"
            checked={friendPostsOnly}
            onChange={(e) => {
              setPosts([]);
              setPage(1);
              setHasMore(true);
              setFriendPostsOnly(e.target.checked);
            }}
          />
          <span className="ml-2 text-sm dark:text-gray-300">
            Show posts from friends only
          </span>
        </label>
      </div>

      {/* Create Post Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowCreatePost(true)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-md"
        >
          <FiPlus size={20} />
        </button>
      </div>

      {/* Posts */}
      <div className="p-4 space-y-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white dark:bg-gray-900 rounded-xl p-3 shadow-sm"
            onDoubleClick={() => handleDoubleTap(post.id)}
          >
            {/* Post User */}
            <div className="flex items-center gap-2 mb-2 cursor-pointer">
              <img
                src={post.userAvatar || "/default-avatar.png"}
                className="w-8 h-8 rounded-full"
                alt="avatar"
              />
              <span
                onClick={() => handleFilterByUser(post.userId)}
                className="font-semibold dark:text-white hover:underline"
              >
                {post.username}
              </span>
            </div>

            {/* Media */}
            {renderMedia(post)}

            {/* Actions */}
            <div className="flex items-center justify-between mt-2 text-xl">
              <div className="flex gap-4">
                {likedPosts.includes(post.id) ? (
                  <AiFillHeart className="text-red-500" />
                ) : (
                  <AiOutlineHeart
                    className="cursor-pointer"
                    onClick={() => handleDoubleTap(post.id)}
                  />
                )}
                <AiOutlineComment
                  className="cursor-pointer"
                  onClick={() => handleCommentClick(post)}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {post.likes || 0} likes • {post.comments?.length || 0}{" "}
                  comments
                </span>
              </div>
              <div>
                {savedPosts.includes(post.id) ? (
                  <AiFillSave
                    className="cursor-pointer"
                    onClick={() => toggleSave(post.id)}
                  />
                ) : (
                  <AiOutlineSave
                    className="cursor-pointer"
                    onClick={() => toggleSave(post.id)}
                  />
                )}
              </div>
            </div>

            {/* Caption */}
            {post.caption && (
              <p className="mt-2 text-sm dark:text-gray-300">{post.caption}</p>
            )}
          </div>
        ))}

        {!hasMore && (
          <div className="text-center text-gray-400 dark:text-gray-600 text-sm mt-8">
            No more posts
          </div>
        )}
      </div>

      {/* Modals */}
      {showCommentModal && (
        <CommentModal
          post={selectedPost}
          onClose={() => setShowCommentModal(false)}
        />
      )}
      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onPost={(newPost) => setPosts((prev) => [newPost, ...prev])}
        />
      )}
    </div>
  );
}
