import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Correctly configure path to find the .env file, regardless of where you run the script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

const rooms = new Map();
const roomData = new Map();

const io = new Server(server, {
    cors: {
        origin: '*', // This is open for development, consider restricting it in production
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("CRITICAL ERROR: GEMINI_API_KEY is not set. AI features will fail.");
}
const genAI = new GoogleGenerativeAI(apiKey);

// --- CORRECTED --- Changed 'python3' to 'python' to match the frontend
const defaultVersions = {
  cpp: "10.2.0",
  python: "3.10.0",
  javascript: "18.15.0",
  java: "15.0.2"
};

function detectLang(code) {
    if (code.includes("#include")) return "C++";
    if (code.includes("def ") || code.includes("print(")) return "Python";
    if (code.includes("function") || code.includes("console.")) return "JavaScript";
    if (code.includes("public class") || code.includes("System.out")) return "Java";
    return "code";
}

io.on('connection', (socket) => {
    let currentRoom = null;
    let currentUser = null;

    socket.on("join", ({ roomId, userName }) => {
        if (currentRoom) {
            socket.leave(currentRoom);
            if (rooms.has(currentRoom)) {
                rooms.get(currentRoom).delete(currentUser);
                io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
            }
        }
        currentRoom = roomId;
        currentUser = userName;
        socket.join(roomId);
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(userName);
        io.to(roomId).emit("userJoined", Array.from(rooms.get(roomId)));
        const roomInfo = roomData.get(roomId);
        if (roomInfo?.code) socket.emit("codeUpdate", roomInfo.code);
        if (roomInfo?.language) socket.emit("languageUpdate", roomInfo.language);
        if (roomInfo?.theme) socket.emit("themeUpdate", roomInfo.theme);
    });

    socket.on("codeChange", ({ roomId, code }) => {
        socket.to(roomId).emit("codeUpdate", code);
        if (!roomData.has(roomId)) roomData.set(roomId, {});
        roomData.get(roomId).code = code;
    });

    socket.on("leaveRoom", () => {
         if(currentRoom && currentUser && rooms.has(currentRoom)){
            rooms.get(currentRoom).delete(currentUser);
            io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
            socket.leave(currentRoom);
            currentRoom = null;
            currentUser = null;
        }
    });

    socket.on("typing", (roomId, userName) => {
        socket.to(roomId).emit("userTyping", userName);
    });

    socket.on("languageChange", ({ roomId, language }) => {
        io.to(roomId).emit("languageUpdate", language);
        if (!roomData.has(roomId)) roomData.set(roomId, {});
        roomData.get(roomId).language = language;
    });

    socket.on("themeChange", ({ roomId, theme }) => {
        io.to(roomId).emit("themeUpdate", theme);
        if (!roomData.has(roomId)) roomData.set(roomId, {});
        roomData.get(roomId).theme = theme;
    });

    socket.on("compileCode", async ({ code, roomId, language, version, stdin }) => {
        if (!rooms.has(roomId)) return;

        // --- CORRECTED --- Simplified language handling logic
        const apiLanguage = language === 'cpp' ? 'c++' : language;
        const apiVersion = (version === "*") ? defaultVersions[language] : version;

        if (!apiVersion) {
            return socket.emit("codeResponse", {
                run: { output: `Error: No default version found for language '${language}'.` }
            });
        }

        try {
            const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
                language: apiLanguage,
                version: apiVersion,
                files: [{ content: code }],
                stdin: stdin || ""
            });
            socket.emit("codeResponse", response.data);
        } catch (error) {
            socket.emit("codeResponse", {
                run: { output: `Error: ${error.response?.data?.message || error.message}` }
            });
        }
    });

    socket.on("getAIReview", async ({roomId, code}) => {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `
            You're an expert code reviewer of the language "${detectLang(code)}" and love to give code suggestions.
            Generate a brief review of the code "${code}".
            Format clearly with markdown headings and bullet points.
            `;
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            io.to(roomId).emit("AIReview", text);
        }
        catch(error){
            console.error("AI Review Error:", error);
            io.to(roomId).emit("AIReview", "Unable to review currently please try later");
        }
    });

    socket.on("disconnect" , () => {
        if(currentRoom && currentUser && rooms.has(currentRoom)){
            rooms.get(currentRoom).delete(currentUser);
            io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
        }
    });
});

const PORT = process.env.PORT || 5001;

// --- REMOVED --- Static file serving is no longer needed for deployment
// app.use(...) and app.get(...) have been removed.

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

