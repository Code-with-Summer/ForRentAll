import { Link } from "react-router-dom";
import logoStrip from "../images/logo strip.jpeg";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__col">
          <img src={logoStrip} alt="RentForAll" className="site-footer__logo" />
          <p>Smart rental management for owners and tenants. Track properties, invoices, maintenance, and subscriptions in one place.</p>
        </div>

        <div className="site-footer__col">
          <h4>Legal</h4>
          <ul>
            <li><Link to="/tos">Terms and Conditions</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/legal">Legal Information</Link></li>
          </ul>
        </div>

        <div className="site-footer__col">
          <h4>Head Office</h4>
          <p>RentForAll</p>
          <p>Pendra</p>
          <p>Madhya Pradesh, India</p>
        </div>

        <div className="site-footer__col">
          <h4>Contact</h4>
          <p>Email: <a href="mailto:support@rentforall.com">support@rentforall.com</a></p>
          <p>or Call <a href="tel:+919039252504"> +91 90392 52504</a></p>
          <p><Link to="/contact">Contact Support</Link></p>
        </div>
      </div>

      <div className="site-footer__bottom">
        <small> {new Date().getFullYear()} RentForAll. Built for Easier Renting.</small>
      </div>
    </footer>
  );
}
