const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const path = require("path");
const { Pool } = require("pg");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
  maxHttpBufferSize: 1e8,
  pingTimeout: 60000,
});

// NeonDB Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Import socket events and user definitions
const { SocketEvent } = require("./socket");
const { USER_CONNECTION_STATUS, defaultUser } = require("./user");

let userSocketMap = [];

// Function to get all users in a room
function getUsersInRoom(roomId) {
  return userSocketMap.filter((user) => user.roomId === roomId);
}

// Function to get room id by socket id
function getRoomId(socketId) {
  const roomId = userSocketMap.find((user) => user.socketId === socketId)?.roomId;
  if (!roomId) {
    console.error("Room ID is undefined for socket ID:", socketId);
    return null;
  }
  return roomId;
}

// Function to get user by socket id
function getUserBySocketId(socketId) {
  const user = userSocketMap.find((user) => user.socketId === socketId);
  if (!user) {
    console.error("User not found for socket ID:", socketId);
    return null;
  }
  return user;
}

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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      result = await axios.get(
        `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
        {
          headers: {
            "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      );
    } while (result.data.status.id <= 2);

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

// Store room data in NeonDB
const saveRoomData = async (roomId, data) => {
  try {
    await pool.query(
      "INSERT INTO rooms (room_id, data) VALUES ($1, $2) ON CONFLICT (room_id) DO UPDATE SET data = $2",
      [roomId, JSON.stringify(data)]
    );
  } catch (error) {
    console.error("Error saving room data to NeonDB:", error);
  }
};

// Load room data from NeonDB
const loadRoomData = async (roomId) => {
  try {
    const result = await pool.query("SELECT data FROM rooms WHERE room_id = $1", [roomId]);
    if (result.rows.length > 0) {
      return result.rows[0].data;
    }
    return null;
  } catch (error) {
    console.error("Error loading room data from NeonDB:", error);
    return null;
  }
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on(SocketEvent.JOIN_REQUEST, async ({ roomId, username }) => {
    const isUsernameExist = getUsersInRoom(roomId).filter(
      (u) => u.username === username
    );
    if (isUsernameExist.length > 0) {
      io.to(socket.id).emit(SocketEvent.USERNAME_EXISTS);
      return;
    }

    const user = {
      username,
      roomId,
      status: USER_CONNECTION_STATUS.ONLINE,
      cursorPosition: 0,
      typing: false,
      socketId: socket.id,
      currentFile: null,
    };
    userSocketMap.push(user);
    socket.join(roomId);

    // Load room data from NeonDB
    const roomData = await loadRoomData(roomId);
    if (roomData) {
      // Emit file structure and other data to the joining user
      io.to(socket.id).emit(SocketEvent.SYNC_FILE_STRUCTURE, roomData);
    }

    socket.broadcast.to(roomId).emit(SocketEvent.USER_JOINED, { user });
    const users = getUsersInRoom(roomId);
    io.to(socket.id).emit(SocketEvent.JOIN_ACCEPTED, { user, users });

    // Save updated user list to NeonDB
    await saveRoomData(roomId, { users, fileStructure: roomData?.fileStructure || {} });
  });

  socket.on("disconnecting", async () => {
    const user = getUserBySocketId(socket.id);
    if (!user) return;
    const roomId = user.roomId;
    socket.broadcast.to(roomId).emit(SocketEvent.USER_DISCONNECTED, { user });
    userSocketMap = userSocketMap.filter((u) => u.socketId !== socket.id);
    socket.leave(roomId);

    // Save updated user list to NeonDB
    const users = getUsersInRoom(roomId);
    const roomData = await loadRoomData(roomId);
    await saveRoomData(roomId, { users, fileStructure: roomData?.fileStructure || {} });
  });

  socket.on(SocketEvent.SYNC_FILE_STRUCTURE, async ({ fileStructure, openFiles, activeFile, socketId }) => {
    io.to(socketId).emit(SocketEvent.SYNC_FILE_STRUCTURE, {
      fileStructure,
      openFiles,
      activeFile,
    });

    // Save file structure to NeonDB
    const roomId = getRoomId(socket.id);
    if (roomId) {
      const users = getUsersInRoom(roomId);
      await saveRoomData(roomId, { users, fileStructure, openFiles, activeFile });
    }
  });

  socket.on(SocketEvent.DIRECTORY_CREATED, async ({ parentDirId, newDirectory }) => {
    const roomId = getRoomId(socket.id);
    if (!roomId) return;
    socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_CREATED, {
      parentDirId,
      newDirectory,
    });

    // Update NeonDB
    const roomData = await loadRoomData(roomId);
    if (roomData) {
      roomData.fileStructure = roomData.fileStructure || {};
      // Update file structure logic here (simplified for now)
      await saveRoomData(roomId, roomData);
    }
  });

  socket.on(SocketEvent.DIRECTORY_UPDATED, async ({ dirId, children }) => {
    const roomId = getRoomId(socket.id);
    if (!roomId) return;
    socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_UPDATED, {
      dirId,
      children,
    });

    // Update NeonDB
    const roomData = await loadRoomData(roomId);
    if (roomData) {
      roomData.fileStructure = roomData.fileStructure || {};
      // Update file structure logic here
      await saveRoomData(roomId, roomData);
    }
  });

  socket.on(SocketEvent.DIRECTORY_RENAMED, async ({ dirId, newName }) => {
    const roomId = getRoomId(socket.id);
    if (!roomId) return;
    socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_RENAMED, {
      dirId,
      newName,
    });

    // Update NeonDB
    const roomData = await loadRoomData(roomId);
    if (roomData) {
      roomData.fileStructure = roomData.fileStructure || {};
      // Update file structure logic here
      await saveRoomData(roomId, roomData);
    }
  });

  socket.on(SocketEvent.DIRECTORY_DELETED, async ({ dirId }) => {
    const roomId = getRoomId(socket.id);
    if (!roomId) return;
    socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_DELETED, { dirId });

    // Update NeonDB
    const roomData = await loadRoomData(roomId);
    if (roomData) {
      roomData.fileStructure = roomData.fileStructure || {};
      // Update file structure logic here
      await saveRoomData(roomId, roomData);
    }
  });

  socket.on(SocketEvent.FILE_CREATED, async ({ parentDirId, newFile }) => {
    const roomId = getRoomId(socket.id);
    if (!roomId) return;
    socket.broadcast.to(roomId).emit(SocketEvent.FILE_CREATED, { parentDirId, newFile });

    // Update NeonDB
    const roomData = await loadRoomData(roomId);
    if (roomData) {
      roomData.fileStructure = roomData.fileStructure || {};
      // Update file structure logic here
      await saveRoomData(roomId, roomData);
    }
  });

  socket.on(SocketEvent.FILE_UPDATED, async ({ fileId, newContent }) => {
    const roomId = getRoomId(socket.id);
    if (!roomId) return;
    socket.broadcast.to(roomId).emit(SocketEvent.FILE_UPDATED, {
      fileId,
      newContent,
    });

    // Update NeonDB
    const roomData = await loadRoomData(roomId);
    if (roomData) {
      roomData.fileStructure = roomData.fileStructure || {};
      // Update file structure logic here
      await saveRoomData(roomId, roomData);
    }
  });

  socket.on(SocketEvent.FILE_RENAMED, async ({ fileId, newName }) => {
    const roomId = getRoomId(socket.id);
    if (!roomId) return;
    socket.broadcast.to(roomId).emit(SocketEvent.FILE_RENAMED, {
      fileId,
      newName,
    });

    // Update NeonDB
    const roomData = await loadRoomData(roomId);
    if (roomData) {
      roomData.fileStructure = roomData.fileStructure || {};
      // Update file structure logic here
      await saveRoomData(roomId, roomData);
    }
  });

  socket.on(SocketEvent.FILE_DELETED, async ({ fileId }) => {
    const roomId = getRoomId(socket.id);
    if (!roomId) return;
    socket.broadcast.to(roomId).emit(SocketEvent.FILE_DELETED, { fileId });

    // Update NeonDB
    const roomData = await loadRoomData(roomId);
    if (roomData) {
      roomData.fileStructure = roomData.fileStructure || {};
      // Update file structure logic here
      await saveRoomData(roomId, roomData);
    }
  });

  socket.on(SocketEvent.USER_OFFLINE, async ({ socketId }) => {
    userSocketMap = userSocketMap.map((user) => {
      if (user.socketId === socketId) {
        return { ...user, status: USER_CONNECTION_STATUS.OFFLINE };
      }
      return user;
    });
    const roomId = getRoomId(socketId);
    if (!roomId) return;
    socket.broadcast.to(roomId).emit(SocketEvent.USER_OFFLINE, { socketId });

    // Update NeonDB
    const users = getUsersInRoom(roomId);
    const roomData = await loadRoomData(roomId);
    await saveRoomData(roomId, { users, fileStructure: roomData?.fileStructure || {} });
  });

  socket.on(SocketEvent.USER_ONLINE, async ({ socketId }) => {
    userSocketMap = userSocketMap.map((user) => {
      if (user.socketId === socketId) {
        return { ...user, status: USER_CONNECTION_STATUS.ONLINE };
      }
      return user;
    });
    const roomId = getRoomId(socketId);
    if (!roomId) return;
    socket.broadcast.to(roomId).emit(SocketEvent.USER_ONLINE, { socketId });

    // Update NeonDB
    const users = getUsersInRoom(roomId);
    const roomData = await loadRoomData(roomId);
    await saveRoomData(roomId, { users, fileStructure: roomData?.fileStructure || {} });
  });

  socket.on(SocketEvent.SEND_MESSAGE, async ({ message }) => {
    const roomId = getRoomId(socket.id);
    if (!roomId) return;
    socket.broadcast.to(roomId).emit(SocketEvent.RECEIVE_MESSAGE, { message });

    // Update NeonDB (store chat messages)
    const roomData = await loadRoomData(roomId);
    if (roomData) {
      roomData.chat = roomData.chat || [];
      roomData.chat.push(message);
      await saveRoomData(roomId, roomData);
    }
  });

  socket.on(SocketEvent.TYPING_START, ({ cursorPosition }) => {
    userSocketMap = userSocketMap.map((user) => {
      if (user.socketId === socket.id) {
        return { ...user, typing: true, cursorPosition };
      }
      return user;
    });
    const user = getUserBySocketId(socket.id);
    if (!user) return;
    const roomId = user.roomId;
    socket.broadcast.to(roomId).emit(SocketEvent.TYPING_START, { user });
  });

  socket.on(SocketEvent.TYPING_PAUSE, () => {
    userSocketMap = userSocketMap.map((user) => {
      if (user.socketId === socket.id) {
        return { ...user, typing: false };
      }
      return user;
    });
    const user = getUserBySocketId(socket.id);
    if (!user) return;
    const roomId = user.roomId;
    socket.broadcast.to(roomId).emit(SocketEvent.TYPING_PAUSE, { user });
  });

  socket.on(SocketEvent.REQUEST_DRAWING, () => {
    const roomId = getRoomId(socket.id);
    if (!roomId) return;
    socket.broadcast.to(roomId).emit(SocketEvent.REQUEST_DRAWING, { socketId: socket.id });
  });

  socket.on(SocketEvent.SYNC_DRAWING, ({ drawingData, socketId }) => {
    socket.broadcast.to(socketId).emit(SocketEvent.SYNC_DRAWING, { drawingData });
  });

  socket.on(SocketEvent.DRAWING_UPDATE, async ({ snapshot }) => {
    const roomId = getRoomId(socket.id);
    if (!roomId) return;
    socket.broadcast.to(roomId).emit(SocketEvent.DRAWING_UPDATE, { snapshot });

    // Update NeonDB (store drawing data)
    const roomData = await loadRoomData(roomId);
    if (roomData) {
      roomData.drawing = snapshot;
      await saveRoomData(roomId, roomData);
    }
  });

  socket.on(SocketEvent.EXECUTE_CODE, async ({ fileId, languageId }) => {
    const roomId = getRoomId(socket.id);
    if (!roomId) return;
    const roomData = await loadRoomData(roomId);
    if (!roomData || !roomData.fileStructure) return;

    // Find the file content (simplified; adjust based on your file structure)
    const sourceCode = roomData.fileStructure[fileId]?.content || "";
    const result = await executeCode(sourceCode, languageId);
    io.to(roomId).emit(SocketEvent.EXECUTION_RESULT, result);
  });

  socket.on(SocketEvent.GET_CODE_SUGGESTION, async ({ prompt }) => {
    const suggestion = await getCodeSuggestion(prompt);
    socket.emit(SocketEvent.CODE_SUGGESTION, suggestion);
  });
});

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});