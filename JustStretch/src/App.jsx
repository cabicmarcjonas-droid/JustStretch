import { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import ExercisePage from "./pages/ExercisePage";
import { useTheme } from "./hooks/useTheme";
import { UserContext, ThemeContext } from "./context/AppContext";

// The "bouncer" — checks login status before showing a page
function ProtectedRoute({ isLoggedIn, children }) {
  if (!isLoggedIn) {
    // Not logged in? Send them back to Login.
    return <Navigate to="/" replace />;
  }
  // Logged in? Show the page.
  return children;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const theme = useTheme();

  const handleLoginSuccess = useCallback((email) => {
    setIsLoggedIn(true);
    if (email) setUserEmail(email);
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setUserEmail("");
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      <UserContext.Provider value={{ isLoggedIn, userEmail, onLogout: handleLogout }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/login"
              element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
            />
            <Route
              path="/main"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <MainPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exercise/:id"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <ExercisePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
}

export default App;