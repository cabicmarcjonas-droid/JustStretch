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
    const email = e.target.elements.email?.value || "";
    onLoginSuccess(email);
    navigate("/main");
  };

  return (
    <div className={`form register ${activeView === "register" ? "active" : ""}`}>
      <h2>Sign Up</h2>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="register-name" className="sr-only">Full name</label>
        <input id="register-name" type="text" name="name" autoComplete="name" placeholder="Juan Dela Cruz…" required spellCheck={false} />
        <label htmlFor="register-email" className="sr-only">Email address</label>
        <input id="register-email" type="email" name="email" autoComplete="email" placeholder="juandelacruz@gmail.com…" required spellCheck={false} inputMode="email" />
        <label htmlFor="register-password" className="sr-only">Password</label>
        <input id="register-password" type="password" name="new-password" autoComplete="new-password" placeholder="Create a password…" required />
        <button type="submit">SIGN UP</button>
      </form>
    </div>
  );
};

const LoginForm = ({ activeView, onLoginSuccess }) => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = e.target.elements.email?.value || "";
    onLoginSuccess(email);
    navigate("/main");
  };

  return (
    <div className={`form login ${activeView === "login" ? "active" : ""}`}>
      <h2>Login</h2>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="login-email" className="sr-only">Email</label>
        <input id="login-email" type="email" name="email" autoComplete="email" placeholder="juandelacruz@gmail.com…" required spellCheck={false} inputMode="email" />
        <label htmlFor="login-password" className="sr-only">Password</label>
        <input id="login-password" type="password" name="current-password" autoComplete="current-password" placeholder="Your password…" required />
        <button type="button" className="link-btn">Forgot password?</button>
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
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="login-card" id="main-content">
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