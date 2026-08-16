import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <hr />
      <p><strong>JustStretch</strong></p>
      <p><i>Just a team with a big dream.</i></p>
      
      <nav classname='foot-links'>
        <Link to="/about" style={{ margin: '0 10px' }}>About</Link>
        <Link to="/contact" style={{ margin: '0 10px' }}>Contact</Link>
      </nav>

      <p>
        &copy; {new Date().getFullYear()}
      </p>
    </footer>
  );
}