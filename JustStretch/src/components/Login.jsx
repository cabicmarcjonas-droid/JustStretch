import { useState } from "react";
import "../css/Login.css";
import { useNavigate } from "react-router-dom";

const CardBackground = ({ activeView }) => {
  return <div className={`card-bg ${activeView === "login" ? "login" : ""}`} />;
};

const SocialButtons = () => {
  return (
    <div className="sso">
      <a className="fa-brands fa-facebook"></a>
      <a className="fa-brands fa-twitter"></a>
      <a className="fa-brands fa-linkedin"></a>
    </div>
  );
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

const RegisterForm = ({ activeView }) => {
  return (
    <div
      className={`form register ${activeView === "register" ? "active" : ""}`}
    >
      <h2>Sign Up</h2>
      <SocialButtons />
      <p>Or use your email address</p>

      <form>
        <input type="text" placeholder="Full name" />
        <input type="email" placeholder="Email address" />
        <input type="password" placeholder="Password" />
        <button>SIGN UP</button>
      </form>
    </div>
  );
};

const LoginForm = ({ activeView, onLoginSuccess }) => {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
    e.preventDefault();
    onLoginSuccess();   // flips the switch ON in App.jsx
    navigate("/home");  // sends user to Home
  };

  return (
    <div className={`form login ${activeView === "login" ? "active" : ""}`}>
      <h2>Login</h2>
      <SocialButtons />
      <p>Or use your email address</p>

      <form onSubmit={handleSubmit}>
        {/* CHANGED: was type="text", now type="email" (bug fix) */}
        <input type="email" placeholder="Email" />
        {/* CHANGED: was type="email", now type="password" (bug fix) */}
        <input type="password" placeholder="Password" />
        <a style={{ paddingTop: 6, marginBottom: 7 }}>Forgot password?</a>
        {/* CHANGED: added type="submit" so the button actually submits the form */}
        <button type="submit">LOGIN</button>
      </form>
    </div>
  );
};

export const Login = ({onLoginSuccess}) => {
  const [activeView, setActiveView] = useState("login");

  const toggleView = () => {
    setActiveView(activeView === "login" ? "register" : "login");
  };

  return (
    <section className="page login-page">
      <div className="login-card">
        <CardBackground activeView={activeView} />
        <HeroPanel
          type="register"
          activeView={activeView}
          title="Welcome back"
          text="Login to review your latest profit from investments."
          buttonText="LOGIN"
          onToggle={toggleView}
        />
        <RegisterForm activeView={activeView} />
        <LoginForm activeView={activeView} onLoginSuccess={onLoginSuccess} />
        <HeroPanel
          type="login"
          activeView={activeView}
          title="Hello there"
          text="Begin your journey using this software, and start earning now."
          buttonText="SIGN UP"
          onToggle={toggleView}
        />
      </div>
    </section>
  );
};
