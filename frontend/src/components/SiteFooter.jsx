export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__col">
          <h4>ForRentAll</h4>
          <p>Smart rental management for owners and tenants. Track properties, invoices, maintenance, and subscriptions in one place.</p>
        </div>

        <div className="site-footer__col">
          <h4>Legal</h4>
          <ul>
            <li><a href="/tos">Terms of Service (TOS)</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/legal">Legal & Info</a></li>
          </ul>
        </div>

        <div className="site-footer__col">
          <h4>Head Office</h4>
          <p>ForRentAll</p>
          <p>123 Main Street, Suite 100</p>
          <p>City, State ZIP</p>
        </div>

        <div className="site-footer__col">
          <h4>Contact</h4>
          <p>Email: <a href="mailto:contact@forrentall.example">contact@forrentall.example</a></p>
          <p>Phone: <a href="tel:+15550123456">+1 (555) 012-3456</a></p>
        </div>
      </div>

      <div className="site-footer__bottom">
        <small>(c) {new Date().getFullYear()} ForRentAll. Built for easier renting.</small>
      </div>
    </footer>
  );
}
