import React from 'react';

// Lightweight animation utilities to reduce bundle size
export const fadeIn = {
  initial: { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
  animate: { opacity: 1, transform: 'translateY(0) scale(1)' },
  exit: { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
  transition: 'all 0.2s ease-out'
};

export const slideIn = {
  initial: { transform: 'translateX(100%)' },
  animate: { transform: 'translateX(0)' },
  exit: { transform: 'translateX(100%)' },
  transition: 'transform 0.3s ease-out'
};

export const scaleIn = {
  initial: { transform: 'scale(0.8)', opacity: 0 },
  animate: { transform: 'scale(1)', opacity: 1 },
  exit: { transform: 'scale(0.8)', opacity: 0 },
  transition: 'all 0.2s ease-out'
};

// Simple CSS-based animation component
export function AnimatedDiv({ 
  children, 
  animation = fadeIn, 
  className = '',
  style = {},
  ...props 
}: {
  children: React.ReactNode;
  animation?: typeof fadeIn;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}) {
  return (
    <div
      className={className}
      style={{
        ...style,
        ...animation.animate,
        transition: animation.transition
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// Hover animation utility
export function addHoverAnimation(element: HTMLElement, scale = 1.1) {
  element.style.transition = 'transform 0.2s ease-out';
  
  element.addEventListener('mouseenter', () => {
    element.style.transform = `scale(${scale})`;
  });
  
  element.addEventListener('mouseleave', () => {
    element.style.transform = 'scale(1)';
  });
} 