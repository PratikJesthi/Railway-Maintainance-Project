import React from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] bg-ink-900 text-cream-50 text-[12.5px] px-4 py-2.5 rounded-lg shadow-panel">
      {toast}
    </div>
  );
}
