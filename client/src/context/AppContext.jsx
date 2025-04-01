import { createContext, useState } from "react";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState({});
  const [users, setUsers] = useState([]);
  const [drawingData, setDrawingData] = useState({});

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        setUsers,
        drawingData,
        setDrawingData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}