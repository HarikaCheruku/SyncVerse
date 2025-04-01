import { createContext, useState } from "react";

export const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [isNewMessage, setIsNewMessage] = useState(false);
  const [lastScrollHeight, setLastScrollHeight] = useState(0);

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        isNewMessage,
        setIsNewMessage,
        lastScrollHeight,
        setLastScrollHeight,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}