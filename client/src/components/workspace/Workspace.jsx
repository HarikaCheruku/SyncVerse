import { useState, useEffect, useContext } from "react";
import { useParams, useLocation } from "react-router-dom";
import { SocketContext } from "../../context/SocketContext";
import Sidebar from "../sidebar/Sidebar";
import FileExplorer from "../files/FileExplorer";
import ChatList from "../chat/ChatList";
import ChatInput from "../chat/ChatInput";
import Users from "../common/Users";
import DrawingEditor from "../drawing/DrawingEditor";
import EditorComponent from "../editor/EditorComponent";

function Workspace() {
  const { roomId } = useParams();
  const { state } = useLocation();
  const { username } = state;
  const { socket } = useContext(SocketContext);
  const [activeFeature, setActiveFeature] = useState("code");
  const [users, setUsers] = useState([]);
  const [fileStructure, setFileStructure] = useState({});

  useEffect(() => {
    socket.emit("join-request", { roomId, username });

    socket.on("join-accepted", ({ user, users }) => {
      setUsers(users);
    });

    socket.on("user-joined", ({ user }) => {
      setUsers((prev) => [...prev, user]);
    });

    socket.on("user-disconnected", ({ user }) => {
      setUsers((prev) => prev.filter((u) => u.socketId !== user.socketId));
    });

    socket.on("sync-file-structure", ({ fileStructure }) => {
      setFileStructure(fileStructure);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, username, socket]);

  const handleFeatureSelect = (feature) => {
    setActiveFeature(feature);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar onFeatureSelect={handleFeatureSelect} />
      <div className="flex-1 flex">
        {activeFeature !== "code" && (
          <div className="w-1/3 md:w-1/4 bg-gray-800 p-4 border-r border-gray-700">
            {activeFeature === "files" && <FileExplorer />}
            {activeFeature === "chat" && (
              <div className="flex flex-col h-full">
                <ChatList />
                <ChatInput />
              </div>
            )}
            {activeFeature === "users" && <Users />}
            {activeFeature === "drawing" && <DrawingEditor />}
          </div>
        )}
        <div className="flex-1 p-4">
          <EditorComponent />
        </div>
      </div>
    </div>
  );
}

export default Workspace;