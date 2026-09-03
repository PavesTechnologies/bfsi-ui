import React from "react";
import { whyChooseUs } from "../../content/landingContent";
import Reveal from "./Reveal";

const WhyChooseUs = () => {
  return (
    <section className="landing-section landing-why" id="why-choose-us">
      <div className="landing-why-texture" aria-hidden="true" />
      <div className="landing-why-glow landing-why-glow--accent" aria-hidden="true" />
      <div className="landing-why-glow landing-why-glow--secondary" aria-hidden="true" />

      <div className="landing-section-inner">
        <Reveal as="div" className="landing-section-head">
          <span className="landing-eyebrow landing-eyebrow--light landing-eyebrow--center">
            Why Choose Us
          </span>
          <h2 className="landing-section-title landing-section-title--center landing-why-title-heading">
            Built around trust
          </h2>
        </Reveal>

        <Reveal as="div" className="landing-why-grid">
          {whyChooseUs.map((item, index) => {
            return (
              <div 
                key={item.title} 
                className="landing-why-card"
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div className="landing-why-icon-wrap">
                  <CheckIcon />
                </div>
                <h3 className="landing-why-card-title">{item.title}</h3>
                <p className="landing-why-card-desc">{item.description}</p>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
};

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default WhyChooseUs;
