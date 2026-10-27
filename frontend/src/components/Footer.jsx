import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";
import { CLUB } from "../site.js";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-stripe" aria-hidden="true" />
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="footer-tag">{CLUB.tagline}</p>
          <p className="muted">A community running club for every pace – from first 5k to full marathon.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <ul>
            <li><Link to="/races">Upcoming races</Link></li>
            <li><Link to="/races?tab=recent">Recent races</Link></li>
            <li><Link to="/gallery">Gallery</Link></li>
            <li><Link to="/about">About the club</Link></li>
          </ul>
        </div>
        <div>
          <h4>Runners</h4>
          <ul>
            <li><Link to="/register">Register for a race</Link></li>
            <li><Link to="/signup">Create account</Link></li>
            <li><Link to="/login">Log in</Link></li>
            <li><Link to="/my-races">My races & tickets</Link></li>
          </ul>
        </div>
        <div>
          <h4>Find us</h4>
          <ul>
            <li>{CLUB.location}</li>
            <li><a href={`mailto:${CLUB.email}`}>{CLUB.email}</a></li>
            <li><a href={`https://wa.me/${CLUB.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp {CLUB.phone}</a></li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} {CLUB.fullName}. All rights reserved.</span>
        <span>Made for runners in Chitungwiza 🇿🇼</span>
      </div>
    </footer>
  );
}
