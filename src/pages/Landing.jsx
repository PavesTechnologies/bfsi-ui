import React from "react";
import LandingNav from "../components/landing/LandingNav";
import Hero from "../components/landing/Hero";
import About from "../components/landing/About";
import HowAIHelps from "../components/landing/HowAIHelps";
import DocumentsRequired from "../components/landing/DocumentsRequired";
import WhyChooseUs from "../components/landing/WhyChooseUs";
import FAQ from "../components/landing/FAQ";
import FinalCTA from "../components/landing/FinalCTA";
import "../styles/components.css";
import "../styles/landing.css";

const Landing = () => {
  return (
    <div className="landing">
      <LandingNav />
      <div className="landing-nav-spacer" aria-hidden="true" />

      <Hero />
      <About />
      <HowAIHelps />
      <DocumentsRequired />
      <WhyChooseUs />
      <FAQ />
      <FinalCTA />

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Loan Application. All data is encrypted in transit.</span>
      </footer>
    </div>
  );
};

export default Landing;
