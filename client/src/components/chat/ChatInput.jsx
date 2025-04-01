import { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { ChatContext } from "../../context/ChatContext";
import { SocketContext } from "../../context/SocketContext";
import { formatDate } from "../../utils/formatDate";
import { LuSendHorizonal } from "react-icons/lu";
import { v4 as uuidV4 } from "uuid";

function ChatInput() {
  const { currentUser } = useContext(AppContext);
  const { socket } = useContext(SocketContext);
  const { setMessages } = useContext(ChatContext);
  const inputRef = React.useRef(null);

  const handleSendMessage = (e) => {
    e.preventDefault();

    const inputVal = inputRef.current?.value.trim();

    if (inputVal && inputVal.length > 0) {
      const message = {
        id: uuidV4(),
        message: inputVal,
        username: currentUser.username,
        timestamp: formatDate(new Date().toISOString()),
      };
      socket.emit("send-message", { message });
      setMessages((messages) => [...messages, message]);

      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <form
      onSubmit={handleSendMessage}
      className="flex justify-between rounded-md border border-primary"
    >
      <input
        type="text"
        className="w-full flex-grow rounded-md border-none bg-dark p-2 outline-none"
        placeholder="Enter a message..."
        ref={inputRef}
      />
      <button
        className="flex items-center justify-center rounded-r-md bg-primary p-2 text-black"
        type="submit"
      >
        <LuSendHorizonal size={24} />
      </button>
    </form>
  );
}

export default ChatInput;