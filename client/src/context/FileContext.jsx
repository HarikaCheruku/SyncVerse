import { createContext, useState } from "react";
import { v4 as uuidV4 } from "uuid";

export const FileContext = createContext();

export function FileProvider({ children }) {
  const [fileStructure, setFileStructure] = useState({});
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);

  const closeFile = (fileId) => {
    setOpenFiles((prev) => prev.filter((file) => file.id !== fileId));
    if (activeFile?.id === fileId) {
      setActiveFile(openFiles[0] || null);
    }
  };

  const updateFileContent = (fileId, content) => {
    setOpenFiles((prev) =>
      prev.map((file) => (file.id === fileId ? { ...file, content } : file))
    );
  };

  return (
    <FileContext.Provider
      value={{
        fileStructure,
        setFileStructure,
        openFiles,
        setOpenFiles,
        activeFile,
        setActiveFile,
        closeFile,
        updateFileContent,
      }}
    >
      {children}
    </FileContext.Provider>
  );
}