const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");
const JSZip = require("jszip");
const axios = require("axios");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// NeonDB Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Store rooms, users, and files
const rooms = new Map();

// Judge0 Code Execution
const executeCode = async (sourceCode, languageId) => {
  try {
    const response = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions",
      {
        source_code: sourceCode,
        language_id: languageId, // e.g., 63 for JavaScript
        stdin: "",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );

    const token = response.data.token;
    let result;
    do {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      result = await axios.get(
        `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
        {
          headers: {
            "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      );
    } while (result.data.status.id <= 2); // Wait until processing is done

    return {
      stdout: result.data.stdout || "",
      stderr: result.data.stderr || "",
      error: result.data.compile_output || result.data.message || "",
    };
  } catch (error) {
    console.error("Judge0 Error:", error);
    return { error: "Failed to execute code" };
  }
};

// DeepSeek-Coder-V2 AI Suggestions
const getCodeSuggestion = async (prompt) => {
  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-coder",
        messages: [
          { role: "system", content: "You are a helpful coding assistant." },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek Error:", error);
    return "Failed to get code suggestion";
  }
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", async ({ roomId, username }) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { users: [], files: { "index.js": "" }, chat: [] });
    }
    const room = rooms.get(roomId);
    room.users.push({ id: socket.id, username, online: true });

    await pool.query(
      "INSERT INTO rooms (room_id, data) VALUES ($1, $2) ON CONFLICT (room_id) DO UPDATE SET data = $2",
      [roomId, JSON.stringify(room)]
    );

    io.to(roomId).emit("userList", room.users);
    io.to(roomId).emit("chatMessages", room.chat);
    socket.broadcast.to(roomId).emit("notification", `${username} joined`);
  });

  socket.on("codeChange", ({ roomId, fileId, code }) => {
    const room = rooms.get(roomId);
    room.files[fileId] = code;
    socket.broadcast.to(roomId).emit("codeUpdate", { fileId, code });

    pool.query("UPDATE rooms SET data = $1 WHERE room_id = $2", [
      JSON.stringify(room),
      roomId,
    ]);
  });

  socket.on("createFile", ({ roomId, fileName }) => {
    const room = rooms.get(roomId);
    room.files[fileName] = "";
    io.to(roomId).emit("fileList", room.files);
    pool.query("UPDATE rooms SET data = $1 WHERE room_id = $2", [
      JSON.stringify(room),
      roomId,
    ]);
  });

  socket.on("deleteFile", ({ roomId, fileName }) => {
    const room = rooms.get(roomId);
    delete room.files[fileName];
    io.to(roomId).emit("fileList", room.files);
    pool.query("UPDATE rooms SET data = $1 WHERE room_id = $2", [
      JSON.stringify(room),
      roomId,
    ]);
  });

  socket.on("chatMessage", ({ roomId, message, username }) => {
    const room = rooms.get(roomId);
    room.chat.push({ username, message, timestamp: new Date() });
    io.to(roomId).emit("newMessage", { username, message });
    pool.query("UPDATE rooms SET data = $1 WHERE room_id = $2", [
      JSON.stringify(room),
      roomId,
    ]);
  });

  socket.on("downloadCode", async ({ roomId }) => {
    const room = rooms.get(roomId);
    const zip = new JSZip();
    for (const [fileName, content] of Object.entries(room.files)) {
      zip.file(fileName, content);
    }
    const content = await zip.generateAsync({ type: "nodebuffer" });
    socket.emit("downloadZip", content);
  });

  socket.on("executeCode", async ({ roomId, fileId, languageId }) => {
    const room = rooms.get(roomId);
    const sourceCode = room.files[fileId];
    const result = await executeCode(sourceCode, languageId);
    io.to(roomId).emit("executionResult", result);
  });

  socket.on("getCodeSuggestion", async ({ prompt }) => {
    const suggestion = await getCodeSuggestion(prompt);
    socket.emit("codeSuggestion", suggestion);
  });

  socket.on("disconnect", async () => {
    for (const [roomId, room] of rooms) {
      const user = room.users.find((u) => u.id === socket.id);
      if (user) {
        user.online = false;
        io.to(roomId).emit("userList", room.users);
        socket.broadcast.to(roomId).emit("notification", `${user.username} left`);
        await pool.query("UPDATE rooms SET data = $1 WHERE room_id = $2", [
          JSON.stringify(room),
          roomId,
        ]);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));