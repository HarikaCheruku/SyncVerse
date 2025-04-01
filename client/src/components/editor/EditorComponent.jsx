import { useContext } from "react";
import { FileContext } from "../../context/FileContext";
import useResponsive from "../../hooks/useResponsive";
import Editor from "./Editor";
import FileTab from "./FileTab";

function EditorComponent() {
  const { openFiles } = useContext(FileContext);
  const { minHeightReached } = useResponsive();

  if (openFiles.length <= 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <h1 className="text-xl text-white">No file is currently open.</h1>
      </div>
    );
  }

  return (
    <main
      className={`flex w-full flex-col overflow-x-auto md:h-screen ${
        minHeightReached ? "h-full" : "h-[calc(100vh-50px)]"
      }`}
    >
      <FileTab />
      <Editor />
    </main>
  );
}

export default EditorComponent;