import React, { useEffect, useRef, useState } from "react";

/**
 * Scroll-triggered fade/slide-in wrapper. Fires once, respects
 * prefers-reduced-motion (handled in CSS via .landing-reveal's transition
 * being disabled under that media query), and degrades to "always visible"
 * if IntersectionObserver isn't available.
 */
const Reveal = (props) => {
  const { as = "div", delay = 0, className = "", children, ...rest } = props;
  const Tag = as;
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(node);
          }
        });
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`landing-reveal ${visible ? "landing-reveal--visible" : ""} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
