import React from "react";
import { aiFeatures } from "../../content/landingContent";
import Reveal from "./Reveal";

const TINTS = ["gold", "emerald", "ink"];

const HowAIHelps = () => (
  <section className="landing-section landing-section--tinted" id="how-ai-helps">
    <div className="landing-section-inner">
      <Reveal as="div" className="landing-section-head">
        <span className="landing-eyebrow landing-eyebrow--gold landing-eyebrow--center">How AI Helps</span>
        <h2 className="landing-section-title landing-section-title--center">
          What our AI assistant actually does
        </h2>
      </Reveal>

      <div className="landing-bento">
        {aiFeatures.map((feature, index) => (
          <Reveal
            as="div"
            key={feature.title}
            delay={index * 60}
            className={`landing-bento-card landing-bento-card--${TINTS[index % TINTS.length]} ${
              index === 2 ? "landing-bento-card--wide" : ""
            }`}
          >
            <span className="landing-bento-check" aria-hidden="true">
              <CheckIcon />
            </span>
            <h3 className="landing-bento-title">{feature.title}</h3>
            <p className="landing-bento-description">{feature.description}</p>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
  </svg>
);

export default HowAIHelps;
