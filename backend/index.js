import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv'
dotenv.config();
console.log('API Key Loaded:', process.env.GEMINI_API_KEY);
import { GoogleGenerativeAI } from "@google/generative-ai" ;
const app = express();

const server = http.createServer(app);

const rooms = new Map();
const roomData = new Map();

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const apiKey = process.env.GEMINI_API_KEY; 
console.log(apiKey);
const genAI = new GoogleGenerativeAI(apiKey);

const defaultVersions = {
  cpp: "10.2.0",              // alias for "c++"
  python: "3.10.0",          // sent as "python" or "python3"
  javascript: "18.15.0",      // for Node.js
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
    console.log('A user connected:', socket.id);

    let currentRoom = null;
    let currentUser = null;

    socket.on("join", ({ roomId, userName }) => {
        // Leave previous room if any
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
        if (roomInfo?.code) {
            socket.emit("codeUpdate", roomInfo.code);
        }
        if (roomInfo?.language) {
            socket.emit("languageUpdate", roomInfo.language);
        }
        // --- ADDED ---
        // Send current theme to new user
        if (roomInfo?.theme) {
            socket.emit("themeUpdate", roomInfo.theme);
        }
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
        console.log('A user disconnected');
    })

    socket.on("typing", (roomId, userName) => {
        socket.to(roomId).emit("userTyping", userName);
    })

    socket.on("languageChange", ({ roomId, language }) => {
        io.to(roomId).emit("languageUpdate", language);

        if (!roomData.has(roomId)) roomData.set(roomId, {});
        roomData.get(roomId).language = language;
    });

    // --- NEW EVENT LISTENER FOR THEME ---
    socket.on("themeChange", ({ roomId, theme }) => {
        // Broadcast the new theme to everyone in the room
        io.to(roomId).emit("themeUpdate", theme);

        // Store the theme for the room
        if (!roomData.has(roomId)) roomData.set(roomId, {});
        roomData.get(roomId).theme = theme;
    });
    // --- END OF NEW CODE ---


    socket.on("compileCode", async ({ code, roomId, language, version, stdin }) => {
    if (rooms.has(roomId)) {
        const room = rooms.get(roomId);

        // Convert aliases if needed
        const actualLang = (language === "cpp") ? "c++" :
                        (language === "python3") ? "python" :
                        language;

        const actualVersion = (version === "*") ? defaultVersions[language] : version;

        try {
            const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
                language: actualLang,
                version: actualVersion,
                files: [{ content: code }],
                stdin: stdin || ""
            });
            socket.emit("codeResponse", response.data);  // ✅ Only send to executor
        } catch (error) {
            socket.emit("codeResponse", {
                    run: {
                    output: `Error: ${error.response?.data?.message || error.message}`
                    }
                });
            }
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
            const response = result.response;
            const text = response.text();

            io.to(roomId).emit("AIReview", text);
        }
        catch{
            io.to(roomId).emit("AIReview", "Unable to review currently please try later");
        }
    })

    socket.on("disconnect" , () => {
        if(currentRoom && currentUser && rooms.has(currentRoom)){
            rooms.get(currentRoom).delete(currentUser);
            io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
        }
        console.log('A user disconnected');
    })
});
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});