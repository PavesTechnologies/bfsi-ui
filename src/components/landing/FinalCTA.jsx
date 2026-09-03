import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../FormElements/Button";
import { finalCta } from "../../content/landingContent";
import Reveal from "./Reveal";

const FinalCTA = () => {
  const navigate = useNavigate();
  return (
    <section className="landing-final-cta">
      <div className="landing-final-cta-shape landing-final-cta-shape--a" aria-hidden="true" />
      <div className="landing-final-cta-shape landing-final-cta-shape--b" aria-hidden="true" />
      <div className="landing-final-cta-grid-overlay" aria-hidden="true" />
      <Reveal as="div" className="landing-final-cta-inner">
        <h2 className="landing-final-cta-title">{finalCta.title}</h2>
        <p className="landing-final-cta-subtitle">{finalCta.subtitle}</p>
        <Button variant="primary" onClick={() => navigate("/apply/loan-details")}>
          {finalCta.cta}
        </Button>
      </Reveal>
    </section>
  );
};

export default FinalCTA;
