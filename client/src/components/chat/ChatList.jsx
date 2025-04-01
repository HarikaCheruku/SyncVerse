import { useContext, useEffect, useRef } from "react";
import { AppContext } from "../../context/AppContext";
import { ChatContext } from "../../context/ChatContext";

function ChatList() {
  const { messages, isNewMessage, setIsNewMessage, lastScrollHeight, setLastScrollHeight } = useContext(ChatContext);
  const { currentUser } = useContext(AppContext);
  const messagesContainerRef = useRef(null);

  const handleScroll = (e) => {
    const container = e.target;
    setLastScrollHeight(container.scrollTop);
  };

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (isNewMessage) {
      setIsNewMessage(false);
    }
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = lastScrollHeight;
    }
  }, [isNewMessage, setIsNewMessage, lastScrollHeight]);

  return (
    <div
      className="flex-grow overflow-auto rounded-md bg-darkHover p-2"
      ref={messagesContainerRef}
      onScroll={handleScroll}
    >
      {messages.map((message, index) => (
        <div
          key={index}
          className={
            "mb-2 w-[80%] self-end break-words rounded-md bg-dark px-3 py-2" +
            (message.username === currentUser.username ? " ml-auto " : "")
          }
        >
          <div className="flex justify-between">
            <span className="text-xs text-primary">{message.username}</span>
            <span className="text-xs text-white">{message.timestamp}</span>
          </div>
          <p className="py-1">{message.message}</p>
        </div>
      ))}
    </div>
  );
}

export default ChatList;