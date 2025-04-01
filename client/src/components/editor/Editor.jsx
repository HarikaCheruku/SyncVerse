import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { FileContext } from "../../context/FileContext";
import { SettingContext } from "../../context/SettingContext";
import { SocketContext } from "../../context/SocketContext";
import usePageEvents from "../../hooks/usePageEvents";
import useResponsive from "../../hooks/useResponsive";
import { color } from "@uiw/codemirror-extensions-color";
import { hyperLink } from "@uiw/codemirror-extensions-hyper-link";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import CodeMirror, { scrollPastEnd } from "@uiw/react-codemirror";
import toast from "react-hot-toast";
import { cursorTooltipBaseTheme, tooltipField } from "./tooltip";

function Editor() {
  const { users, currentUser } = useContext(AppContext);
  const { activeFile, setActiveFile } = useContext(FileContext);
  const { theme, language, fontSize } = useContext(SettingContext);
  const { socket } = useContext(SocketContext);
  const { viewHeight } = useResponsive();
  const [timeOut, setTimeOut] = useState(setTimeout(() => {}, 0));
  const [extensions, setExtensions] = useState([]);
  const [output, setOutput] = useState("");
  const [suggestion, setSuggestion] = useState("");

  const filteredUsers = users.filter((u) => u.username !== currentUser.username);

  const onCodeChange = (code, view) => {
    if (!activeFile) return;

    const file = { ...activeFile, content: code };
    setActiveFile(file);
    const cursorPosition = view.state?.selection?.main?.head;
    socket.emit("typing-start", { cursorPosition });
    socket.emit("file-updated", {
      fileId: activeFile.id,
      newContent: code,
    });
    clearTimeout(timeOut);

    const newTimeOut = setTimeout(() => socket.emit("typing-pause"), 1000);
    setTimeOut(newTimeOut);
  };

  const handleExecuteCode = () => {
    socket.emit("execute-code", { fileId: activeFile.id, languageId: 63 }); // 63 is JavaScript in Judge0
  };

  const handleGetSuggestion = () => {
    socket.emit("get-code-suggestion", { prompt: "Suggest an improvement for this code:\n" + activeFile.content });
  };

  usePageEvents();

  useEffect(() => {
    const extensions = [
      color,
      hyperLink,
      tooltipField(filteredUsers),
      cursorTooltipBaseTheme,
      scrollPastEnd(),
    ];
    const langExt = loadLanguage(language.toLowerCase());
    if (langExt) {
      extensions.push(langExt);
    } else {
      toast.error(
        "Syntax highlighting is unavailable for this language. Please adjust the editor settings; it may be listed under a different name.",
        { duration: 5000 }
      );
    }

    setExtensions(extensions);
  }, [filteredUsers, language]);

  useEffect(() => {
    socket.on("execution-result", (result) => {
      setOutput(
        result.stdout
          ? result.stdout
          : result.stderr || result.error || "No output"
      );
    });

    socket.on("code-suggestion", (suggestion) => {
      setSuggestion(suggestion);
    });

    return () => {
      socket.off("execution-result");
      socket.off("code-suggestion");
    };
  }, [socket]);

  return (
    <div className="h-full flex flex-col">
      <CodeMirror
        theme="dark"
        onChange={onCodeChange}
        value={activeFile?.content}
        extensions={extensions}
        minHeight="100%"
        maxWidth="100vw"
        style={{
          fontSize: fontSize + "px",
          height: viewHeight,
          position: "relative",
        }}
      />
      <div className="mt-2 flex space-x-2">
        <button
          onClick={handleExecuteCode}
          className="p-2 bg-blue-500 rounded hover:bg-blue-600"
        >
          Run Code
        </button>
        <button
          onClick={handleGetSuggestion}
          className="p-2 bg-purple-500 rounded hover:bg-purple-600"
        >
          Get AI Suggestion
        </button>
      </div>
      {output && (
        <div className="mt-2 p-2 bg-gray-800 rounded">
          <h3 className="text-sm font-bold">Output:</h3>
          <pre>{output}</pre>
        </div>
      )}
      {suggestion && (
        <div className="mt-2 p-2 bg-gray-800 rounded">
          <h3 className="text-sm font-bold">AI Suggestion:</h3>
          <pre>{suggestion}</pre>
        </div>
      )}
    </div>
  );
}

export default Editor;