import React from "react";
import { faq } from "../../content/landingContent";
import Reveal from "./Reveal";

const FAQ = () => (
  <section className="landing-section landing-section--tinted" id="faq">
    <div className="landing-section-inner landing-section-inner--narrow">
      <Reveal as="div" className="landing-section-head">
        <span className="landing-eyebrow landing-eyebrow--gold landing-eyebrow--center">FAQ</span>
        <h2 className="landing-section-title landing-section-title--center">
          Frequently asked questions
        </h2>
      </Reveal>
      <div className="landing-faq-list">
        {faq.map((item, index) => (
          <Reveal as="details" delay={index * 40} key={item.question} className="landing-faq-item">
            <summary className="landing-faq-question">
              <span className="landing-faq-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <span className="landing-faq-question-text">{item.question}</span>
              <ChevronIcon />
            </summary>
            <p className="landing-faq-answer">{item.answer}</p>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="landing-faq-chevron">
    <path fillRule="evenodd" d="M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z" />
  </svg>
);

export default FAQ;
