import React from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] bg-[#101B2D] border border-[#26364D] text-slate-100 text-[12.5px] font-mono px-4 py-2.5 rounded-md shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
      {toast}
    </div>
  );
}

