'use client';

import React, { useEffect, useRef, useState } from 'react';

type AnimatedSectionProps = {
  children: React.ReactNode;
  id?: string;
  className?: string;
  threshold?: number; // How much of the element needs to be visible to trigger animations
  rootMargin?: string; // Margin around the root
  animateOnce?: boolean; // Whether to animate only once or every time the element enters the viewport
};

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  id,
  className = '',
  threshold = 0.1,
  rootMargin = '0px',
  animateOnce = true,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentRef = sectionRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (animateOnce) {
            observer.unobserve(currentRef);
          }
        } else if (!animateOnce) {
          setIsVisible(false);
        }
      },
      {
        root: null,
        rootMargin,
        threshold,
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin, animateOnce]);

  return (
    <section
      id={id}
      ref={sectionRef}
      className={`${className} ${isVisible ? 'section-visible' : 'section-hidden'}`}
      data-visible={isVisible}
    >
      {children}
    </section>
  );
};

export default AnimatedSection; 