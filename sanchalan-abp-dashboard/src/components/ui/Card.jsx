import React from 'react';

export default function Card({ className = '', children }) {
  return (
    <div className={'bg-cream-50 border border-cream-300 rounded-card shadow-soft ' + className}>
      {children}
    </div>
  );
}
