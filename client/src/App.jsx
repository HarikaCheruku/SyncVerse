import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { ChatProvider } from "./context/ChatContext";
import { FileProvider } from "./context/FileContext";
import { SettingProvider } from "./context/SettingContext";
import { SocketProvider } from "./context/SocketContext";
import Home from "./pages/Home";
import Editor from "./pages/Editor";
import ConnectionStatusPage from "./components/connection/ConnectionStatusPage";

function App() {
  return (
    <Router>
      <SocketProvider>
        <AppProvider>
          <ChatProvider>
            <FileProvider>
              <SettingProvider>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/editor/:roomId" element={<Editor />} />
                  <Route path="/error" element={<ConnectionStatusPage />} />
                </Routes>
              </SettingProvider>
            </FileProvider>
          </ChatProvider>
        </AppProvider>
      </SocketProvider>
    </Router>
  );
}

export default App;