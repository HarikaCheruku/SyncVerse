import { useState } from "react";
import { useNavigate } from "react-router-dom";

function JoinRoomForm() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const joinRoom = () => {
    if (roomId && username) {
      navigate(`/editor/${roomId}`, { state: { username } });
    }
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8);
    setRoomId(id);
  };

  return (
    <div className="w-full max-w-sm">
      <input
        type="text"
        placeholder="Room Id"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <button
        onClick={joinRoom}
        className="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600 transition"
      >
        Join
      </button>
      <button
        onClick={generateRoomId}
        className="w-full p-3 mt-4 bg-transparent border border-gray-700 rounded hover:bg-gray-800 transition"
      >
        Generate Unique Room Id
      </button>
    </div>
  );
}

export default JoinRoomForm;