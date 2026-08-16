import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import ExercisePage from "./pages/ExercisePage";

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

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
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
  );
}

export default App;