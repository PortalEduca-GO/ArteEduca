import React from 'react';

export function PrimaryButton({ className = '', style, onMouseEnter, onMouseLeave, ...props }) {
  const baseStyle = {
    background: 'var(--brand-cta)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 24px',
    fontWeight: 700,
    boxShadow: 'var(--brand-shadow)',
    transition: 'all 0.25s ease',
    ...style,
  };

  const handleMouseEnter = (event) => {
    event.currentTarget.style.background = 'var(--brand-cta-hover)';
    if (typeof onMouseEnter === 'function') {
      onMouseEnter(event);
    }
  };

  const handleMouseLeave = (event) => {
    event.currentTarget.style.background = 'var(--brand-cta)';
    if (typeof onMouseLeave === 'function') {
      onMouseLeave(event);
    }
  };

  return (
    <button
      {...props}
      className={`brand-primary-button ${className}`.trim()}
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
}
