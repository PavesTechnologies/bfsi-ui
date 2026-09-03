import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../FormElements/Button";

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#how-ai-helps", label: "How AI Helps" },
  { href: "#documents", label: "Documents" },
  { href: "#faq", label: "FAQ" },
];

const LandingNav = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);

      // Determine active section
      const sections = LINKS.map(link => link.href.substring(1));
      let current = "";
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            current = `#${section}`;
            break;
          }
        }
      }
      setActiveLink(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLinkClick = (event, href) => {
    event.preventDefault();
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveLink(href);
  };

  const handleCtaClick = () => {
    setMenuOpen(false);
    navigate("/apply/loan-details");
  };

  return (
    <header className={`landing-nav ${scrolled ? "landing-nav--scrolled" : ""} ${menuOpen ? "landing-nav--open" : ""}`}>
      <div className="landing-nav-inner">
        <Link to="/" className="landing-nav-brand" onClick={() => setMenuOpen(false)}>
          <span className="landing-nav-brand-mark" aria-hidden="true">
            <ShieldIcon />
          </span>
          Loan Application
        </Link>

        <nav className="landing-nav-links" aria-label="Page sections">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`landing-nav-link ${activeLink === link.href ? "is-active" : ""}`}
              onClick={(e) => handleLinkClick(e, link.href)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <span className="landing-nav-cta">
          <Button variant="primary" onClick={handleCtaClick}>
            Start Application
          </Button>
        </span>

        <button
          type="button"
          className="landing-nav-toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="landing-nav-toggle-bar" aria-hidden="true" />
          <span className="landing-nav-toggle-bar" aria-hidden="true" />
        </button>
      </div>

      <div className={`landing-nav-mobile ${menuOpen ? "is-open" : ""}`}>
        <nav className="landing-nav-mobile-links" aria-label="Page sections (mobile)">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`landing-nav-mobile-link ${activeLink === link.href ? "is-active" : ""}`}
              onClick={(e) => handleLinkClick(e, link.href)}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <span className="landing-nav-mobile-cta">
          <Button variant="primary" onClick={handleCtaClick}>
            Start Application
          </Button>
        </span>
      </div>

      {menuOpen && (
        <div className="landing-nav-scrim" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}
    </header>
  );
};

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" strokeLinejoin="round" />
  </svg>
);

export default LandingNav;
