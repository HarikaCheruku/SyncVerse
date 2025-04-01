import { useContext, useEffect, useRef } from "react";
import { FileContext } from "../../context/FileContext";
import { SettingContext } from "../../context/SettingContext";
import { Icon } from "@iconify/react";
import { IoClose } from "react-icons/io5";
import langMap from "lang-map";

// Placeholder for getIconClassName (you may need to implement this)
const getIconClassName = (fileName) => {
  const extension = fileName.split(".").pop();
  return `file-type-${extension || "default"}`;
};

// Placeholder for customMapping (you may need to define this)
const customMapping = {
  js: "javascript",
  py: "python",
  // Add more mappings as needed
};

function FileTab() {
  const { openFiles, closeFile, activeFile, updateFileContent, setActiveFile } = useContext(FileContext);
  const { setLanguage } = useContext(SettingContext);
  const fileTabRef = useRef(null);

  const changeActiveFile = (fileId) => {
    if (activeFile?.id === fileId) return;

    updateFileContent(activeFile?.id || "", activeFile?.content || "");

    const file = openFiles.find((file) => file.id === fileId);
    if (file) {
      setActiveFile(file);
    }
  };

  useEffect(() => {
    const fileTabNode = fileTabRef.current;
    if (!fileTabNode) return;

    const handleWheel = (e) => {
      if (e.deltaY > 0) {
        fileTabNode.scrollLeft += 100;
      } else {
        fileTabNode.scrollLeft -= 100;
      }
    };

    fileTabNode.addEventListener("wheel", handleWheel);

    return () => {
      fileTabNode.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    if (!activeFile?.name) return;
    const extension = activeFile.name.split(".").pop();
    if (!extension) return;

    if (customMapping[extension]) {
      setLanguage(customMapping[extension]);
      return;
    }

    const language = langMap.languages(extension);
    setLanguage(language[0]);
  }, [activeFile?.name, setLanguage]);

  return (
    <div
      className="flex h-[50px] w-full select-none gap-2 overflow-x-auto p-2 pb-0"
      ref={fileTabRef}
    >
      {openFiles.map((file) => (
        <span
          key={file.id}
          className={`flex w-fit cursor-pointer items-center rounded-t-md px-2 py-1 text-white ${
            file.id === activeFile?.id ? "bg-darkHover" : ""
          }`}
          onClick={() => changeActiveFile(file.id)}
        >
          <Icon
            icon={getIconClassName(file.name)}
            fontSize={22}
            className="mr-2 min-w-fit"
          />
          <p
            className="flex-grow cursor-pointer overflow-hidden truncate"
            title={file.name}
          >
            {file.name}
          </p>
          <IoClose
            className="ml-3 inline rounded-md hover:bg-darkHover"
            size={20}
            onClick={() => closeFile(file.id)}
          />
        </span>
      ))}
    </div>
  );
}

export default FileTab;