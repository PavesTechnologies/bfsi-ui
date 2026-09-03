import React from "react";
import { documents } from "../../content/landingContent";
import { AadhaarIcon, PanIcon, SalarySlipIcon, BankStatementIcon } from "./illustrations";
import Reveal from "./Reveal";

const ICONS = [AadhaarIcon, PanIcon, SalarySlipIcon, BankStatementIcon];

const DocumentsRequired = () => (
  <section className="landing-section landing-section--tinted" id="documents">
    <div className="landing-section-inner">
      <Reveal as="div" className="landing-section-head">
        <span className="landing-eyebrow landing-eyebrow--gold landing-eyebrow--center">Documents Required</span>
        <h2 className="landing-section-title landing-section-title--center">
          What you'll need on hand
        </h2>
      </Reveal>

      <div className="landing-doc-fan">
        {documents.map((doc, index) => {
          const Icon = ICONS[index % ICONS.length];
          return (
            <Reveal as="div" key={doc.title} delay={index * 70} className="landing-doc-card">
              <span className="landing-doc-icon" aria-hidden="true">
                <Icon />
              </span>
              <h3 className="landing-doc-title">{doc.title}</h3>
              <span
                className={`landing-doc-note ${doc.required ? "landing-doc-note--required" : ""}`}
              >
                {doc.note}
              </span>
            </Reveal>
          );
        })}
      </div>
    </div>
  </section>
);

export default DocumentsRequired;
