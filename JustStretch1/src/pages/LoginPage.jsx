import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/LoginPage.css";

const CardBackground = ({ activeView }) => {
  return <div className={`card-bg ${activeView === "login" ? "login" : ""}`} />;
};

const HeroPanel = ({ type, activeView, title, text, buttonText, onToggle }) => {
  return (
    <div className={`hero ${type} ${activeView === type ? "active" : ""}`}>
      <h2>{title}</h2>
      <p>{text}</p>
      <button type="button" onClick={onToggle}>
        {buttonText}
      </button>
    </div>
  );
};

const RegisterForm = ({ activeView, onLoginSuccess }) => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    onLoginSuccess();
    navigate("/main");
  };

  return (
    <div className={`form register ${activeView === "register" ? "active" : ""}`}>
      <h2>Sign Up</h2>

      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Full name" required />
        <input type="email" placeholder="Email address" required />
        <input type="password" placeholder="Password" required />
        <button type="submit">SIGN UP</button>
      </form>
    </div>
  );
};

const LoginForm = ({ activeView, onLoginSuccess }) => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    onLoginSuccess();
    navigate("/main");
  };

  return (
    <div className={`form login ${activeView === "login" ? "active" : ""}`}>
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Password" required />
        <a>Forgot password?</a>
        <button type="submit">LOGIN</button>
      </form>
    </div>
  );
};

const LoginPage = ({ onLoginSuccess }) => {
  const [activeView, setActiveView] = useState("login");

  const toggleView = () => {
    setActiveView(activeView === "login" ? "register" : "login");
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <CardBackground activeView={activeView} />
        <HeroPanel
          type="register"
          activeView={activeView}
          title="Welcome back"
          text="Already have an account? Sign in to continue your routine."
          buttonText="LOGIN"
          onToggle={toggleView}
        />
        <RegisterForm activeView={activeView} onLoginSuccess={onLoginSuccess} />
        <LoginForm activeView={activeView} onLoginSuccess={onLoginSuccess} />
        <HeroPanel
          type="login"
          activeView={activeView}
          title="New here?"
          text="Create an account and start your first stretch today."
          buttonText="SIGN UP"
          onToggle={toggleView}
        />
      </div>
    </section>
  );
};

export default LoginPage;