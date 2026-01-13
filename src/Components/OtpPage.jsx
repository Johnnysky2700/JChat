import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { IoBackspaceOutline } from "react-icons/io5";
import { MdChevronLeft } from "react-icons/md";
import { useAuth } from "../context/AuthContext";

export default function OtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = location.state || {};  // <-- changed from phone to email
  const { login } = useAuth();

  const [otp, setOtp] = useState("");
  const [showKeypad, setShowKeypad] = useState(true);

  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

  const keypadNumbers = [
    "1", "2", "3",
    "4", "5", "6",
    "7", "8", "9",
    "", "0", "backspace"
  ];

  // TEST EMAILS FOR DEVELOPMENT
  const testEmails = {
    // Existing test users
    "seyi@example.com": {
      code: "123456",
      user: { email: "seyi@example.com", firstName: "Seyi", lastName: "Johnson" }
    },
    "john@example.com": {
      code: "654321",
      user: { email: "john@example.com", firstName: "John", lastName: "Doe" }
    },
    // Seeded Users
    "seed-1@example.com": { code: "123456", user: { email: "seed-1@example.com", id: "1" } },
    "seed-2@example.com": { code: "123456", user: { email: "seed-2@example.com", id: "2" } },
    "seed-3@example.com": { code: "123456", user: { email: "seed-3@example.com", id: "3" } },
    "seed-4@example.com": { code: "123456", user: { email: "seed-4@example.com", id: "4" } },
    "seed-5@example.com": { code: "123456", user: { email: "seed-5@example.com", id: "5" } },
  };

  const handleInput = async (value) => {
    if (value === "backspace") {
      setOtp((prev) => prev.slice(0, -1));
      return;
    }

    if (otp.length < 6) {
      const newOtp = otp + value;
      setOtp(newOtp);

      if (newOtp.length === 6) {
        try {
          // 🔹 TEST EMAIL BYPASS
          if (testEmails[email]) {
            if (newOtp === testEmails[email].code) {
              await login(testEmails[email].user);
              alert("Login successful!");
              navigate("/ContactPage");
            } else {
              alert("Invalid OTP for test email.");
              setOtp("");
            }
            return;
          }

          // 🔹 VERIFY OTP WITH BACKEND
          const verifyRes = await fetch(`${API_BASE}/api/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp: newOtp }),
          });

          // Read as text first to avoid crashing on non-JSON (e.g., HTML 404 page)
          const resText = await verifyRes.text();
          let verifyData;
          try {
            verifyData = JSON.parse(resText);
          } catch (e) {
            verifyData = { error: resText };
          }

          if (verifyRes.status === 404) {
            console.error("OTP verify endpoint not found (404):", resText);
            alert("OTP verification service is unavailable (404). Please try again later.");
            setOtp("");
            return;
          }

          if (verifyRes.status !== 200) {
            console.error("OTP verify failed:", verifyRes.status, verifyData);
            alert(verifyData.error || "Invalid OTP");
            setOtp("");
            return;
          }

          // SUCCESS → login via AuthContext (fetch latest MongoDB data)
          await login(verifyData.user, verifyData.token);

          alert("Login successful!");
          navigate("/ContactPage");

        } catch (error) {
          console.error("OTP ERROR:", error);
          alert("Unable to verify OTP.");
          setOtp("");
        }
      }
    }
  };

  const handleBack = () => navigate("/VerifyPage");

  const [cooldown, setCooldown] = useState(0);
  const handleResend = async () => {
    if (cooldown > 0) return;

    setOtp("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.status !== 200) {
        alert(data.error || "Failed to resend OTP.");
        return;
      }

      alert("A new OTP has been sent to your email.");

      setCooldown(30);

    } catch (err) {
      console.error("Resend OTP error:", err);
      alert("Network error while resending OTP.");
    }
  };

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((time) => time - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    setShowKeypad(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen justify-between p-6 bg-white relative text-black">
      <div>
        <button onClick={handleBack} className="text-2xl mb-6 pb-8">
          <MdChevronLeft />
        </button>

        <div className="flex flex-col items-center justify-center p-6">
          <h1 className="text-2xl font-bold mb-2">Enter Code</h1>
          <p className="text-gray-500 mb-4 text-sm text-center">
            We have sent you an OTP code to <br />
            <span className="font-semibold">{email}</span>
          </p>

          {/* OTP Circles */}
          <div className="flex gap-4 mb-6 pb-6 pt-6">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const char = otp[index] || "";
              return (
                <div
                  key={index}
                  className={`w-6 h-6 flex items-center justify-center text-xl font-semibold
                    ${char ? "" : "rounded-full border-2 border-[#EDEDED] bg-[#EDEDED]"}`}
                >
                  {char}
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleResend}
          className="w-full text-primary py-3 text-sm transition mb-8"
        >
          Resend Code
        </button>
      </div>

      {showKeypad && (
        <div className="absolute bottom-0 left-0 right-0 bg-[#F7F7FC] shadow-2xl text-black">
          <div className="grid grid-cols-3 gap-4 text-2xl text-center p-2">
            {keypadNumbers.map((key, idx) => (
              <button
                key={idx}
                onClick={() => key && handleInput(key)}
                className="py-2 bg-[#F7F7FC] hover:bg-gray-200"
              >
                {key === "backspace"
                  ? <IoBackspaceOutline className="mx-auto" />
                  : key}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
