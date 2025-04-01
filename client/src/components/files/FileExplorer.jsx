import { useContext, useState } from "react";
import { FileContext } from "../../context/FileContext";
import { SocketContext } from "../../context/SocketContext";
import { v4 as uuidV4 } from "uuid";

function FileExplorer() {
  const { fileStructure, setFileStructure } = useContext(FileContext);
  const { socket } = useContext(SocketContext);
  const [newFileName, setNewFileName] = useState("");
  const [newDirName, setNewDirName] = useState("");

  const handleCreateFile = () => {
    if (!newFileName) return;
    const newFile = {
      id: uuidV4(),
      name: newFileName,
      content: "",
      type: "file",
    };
    socket.emit("file-created", { parentDirId: "root", newFile });
    setNewFileName("");
  };

  const handleCreateDirectory = () => {
    if (!newDirName) return;
    const newDirectory = {
      id: uuidV4(),
      name: newDirName,
      type: "directory",
      children: [],
    };
    socket.emit("directory-created", { parentDirId: "root", newDirectory });
    setNewDirName("");
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">File Explorer</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="New file name"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded mb-2"
        />
        <button
          onClick={handleCreateFile}
          className="w-full p-2 bg-green-500 rounded hover:bg-green-600"
        >
          Create File
        </button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="New directory name"
          value={newDirName}
          onChange={(e) => setNewDirName(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded mb-2"
        />
        <button
          onClick={handleCreateDirectory}
          className="w-full p-2 bg-green-500 rounded hover:bg-green-600"
        >
          Create Directory
        </button>
      </div>
      {/* Simplified file structure display */}
      <div>
        {Object.values(fileStructure || {}).map((item) => (
          <div key={item.id} className="p-2 hover:bg-gray-700 rounded">
            {item.type === "directory" ? "📁" : "📄"} {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FileExplorer;