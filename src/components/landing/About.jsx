import React from "react";
import { about } from "../../content/landingContent";
import { FlowIllustration } from "./illustrations";
import Reveal from "./Reveal";

const About = () => (
  <section className="landing-section landing-about" id="about">
    <div className="landing-section-inner landing-about-grid">
      <Reveal as="div" className="landing-about-lede">
        <span className="landing-eyebrow landing-eyebrow--gold">About</span>
        <p className="landing-about-pullquote">{about.paragraphs[0]}</p>
      </Reveal>

      <Reveal as="div" className="landing-about-body" delay={100}>
        {about.paragraphs.slice(1).map((p) => (
          <p className="landing-section-text" key={p}>
            {p}
          </p>
        ))}
        <div className="landing-about-flow">
          <FlowIllustration />
        </div>
      </Reveal>
    </div>
  </section>
);

export default About;
