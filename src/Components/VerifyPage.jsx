import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdChevronLeft } from "react-icons/md";

export default function VerifyPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");       // ✅ Inline error
  const [loading, setLoading] = useState(false); // ✅ Loading state
  const domain = "@gmail.com";

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (user) navigate("/ContactPage");
  }, [navigate]);

  const handleContinue = async () => {
    setError(""); // Clear previous error

    if (!username || username.length < 2) {
      setError("Enter a valid username or email.");
      return;
    }

    // Allow full email or append domain
    const email = username.includes("@") ? username : username + domain;

    setLoading(true);
    try {
      const API_URL = `${process.env.REACT_APP_API_BASE || "http://localhost:3000"}/api/auth/send-otp`;
      const response = await fetch(
        API_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send OTP.");
        return;
      }

      alert("OTP sent to your email!");
      navigate("/OtpPage", { state: { email } });
    } catch (err) {
      console.error("OTP SEND ERROR:", err);
      setError(
        "Failed to send OTP. Make sure your backend is running and accessible."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate("/WalkThrough");

  return (
    <div className="flex flex-col min-h-screen justify-between bg-white dark:bg-black text-black dark:text-white p-6">
      <div>
        <button onClick={handleBack} className="text-2xl mb-6">
          <MdChevronLeft />
        </button>

        <h1 className="text-2xl pt-12 font-bold mb-2">Email Verification</h1>

        <p className="mb-6 text-center">
          Enter your Gmail username (your email will become username{domain})
        </p>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter Gmail username"
          className="w-full bg-[#F7F7FC] dark:bg-gray-900 px-4 py-4 rounded-xl text-lg outline-none"
        />

        {/* ✅ Inline error message */}
        {error && <p className="text-red-500 mt-2">{error}</p>}

        <button
          onClick={handleContinue}
          disabled={loading} // ✅ Disable while loading
          className="w-full bg-blue-600 text-white py-3 rounded-full text-[16px] hover:bg-blue-700 mt-6 disabled:opacity-50"
        >
          {loading ? "Sending OTP..." : "Continue"} {/* ✅ Show loading */}
        </button>
      </div>
    </div>
  );
}
