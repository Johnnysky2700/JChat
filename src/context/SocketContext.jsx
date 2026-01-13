import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

// Setup socket connection
// Adjust URL if backend is hosted elsewhere
const SOCKET_URL = "http://localhost:3000";

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Create socket connection
        const newSocket = io(SOCKET_URL, {
            transports: ["websocket"],
            // Add authentication token if needed
            // auth: { token: '...' }
        });

        newSocket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
