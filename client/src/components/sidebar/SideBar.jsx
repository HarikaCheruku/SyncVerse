import { useState } from "react";
import { FaFileAlt, FaUsers, FaComments, FaDownload, FaPaintBrush } from "react-icons/fa";

function Sidebar({ onFeatureSelect }) {
  const [activeFeature, setActiveFeature] = useState("code");

  const handleSelect = (feature) => {
    setActiveFeature(feature);
    onFeatureSelect(feature);
  };

  return (
    <div className="w-16 bg-gray-800 flex flex-col items-center py-4 border-r border-gray-700">
      <button
        onClick={() => handleSelect("files")}
        className={`p-3 ${activeFeature === "files" ? "bg-gray-700" : "hover:bg-gray-700"} rounded`}
      >
        <FaFileAlt className="text-2xl" />
      </button>
      <button
        onClick={() => handleSelect("users")}
        className={`p-3 ${activeFeature === "users" ? "bg-gray-700" : "hover:bg-gray-700"} rounded`}
      >
        <FaUsers className="text-2xl" />
      </button>
      <button
        onClick={() => handleSelect("chat")}
        className={`p-3 ${activeFeature === "chat" ? "bg-gray-700" : "hover:bg-gray-700"} rounded`}
      >
        <FaComments className="text-2xl" />
      </button>
      <button
        onClick={() => handleSelect("drawing")}
        className={`p-3 ${activeFeature === "drawing" ? "bg-gray-700" : "hover:bg-gray-700"} rounded`}
      >
        <FaPaintBrush className="text-2xl" />
      </button>
      <button
        onClick={() => handleSelect("download")}
        className={`p-3 ${activeFeature === "download" ? "bg-gray-700" : "hover:bg-gray-700"} rounded`}
      >
        <FaDownload className="text-2xl" />
      </button>
    </div>
  );
}

export default Sidebar;