import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../FormElements/Button";
import { hero } from "../../content/landingContent";
import { HeroIllustration } from "./illustrations";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="landing-hero">
      <div className="landing-hero-blob landing-hero-blob--a" aria-hidden="true" />
      <div className="landing-hero-blob landing-hero-blob--b" aria-hidden="true" />
      <div className="landing-hero-grid-overlay" aria-hidden="true" />

      <div className="landing-hero-inner">
        <div className="landing-hero-copy">
          <span className="landing-eyebrow">{hero.eyebrow}</span>
          <h1 className="landing-hero-title">
            Apply for your loan,
            <br />
            <em>guided</em> every step of the way
          </h1>
          <p className="landing-hero-subtitle">{hero.subtitle}</p>

          <div className="landing-hero-actions">
            <Button variant="primary" onClick={() => navigate("/apply/loan-details")}>
              {hero.primaryCta}
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              {hero.secondaryCta}
            </Button>
          </div>
        </div>

        <div className="landing-hero-visual">
          <HeroIllustration />

          <div className="landing-floating-chip landing-floating-chip--time">
            <ClockIcon />
            <div>
              <strong>{hero.estimate}</strong>
              <span>to apply</span>
            </div>
          </div>

          {hero.trustBadges.map((badge, index) => (
            <div className={`landing-floating-chip landing-floating-chip--badge-${index}`} key={badge}>
              <ShieldIcon />
              <span>{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 4.5V8l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" strokeLinejoin="round" />
  </svg>
);

export default Hero;
