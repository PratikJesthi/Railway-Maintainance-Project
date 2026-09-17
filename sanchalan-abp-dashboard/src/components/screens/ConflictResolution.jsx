import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import Card from '../ui/Card.jsx';

export default function ConflictResolution() {
  const { resolved, resolveConflict, aiMode } = useApp();
  const [showOverride, setShowOverride] = useState(false);

  return (
    <div className="screen-enter">
      {resolved && (
        <div className="mb-3.5 px-4 py-3 rounded-lg border border-[#B7D9C2] bg-[#EAF6EE] text-[12px] text-[#2E6D44]">
          ✓ Conflict C-1 resolved — blocks merged into combined block{' '}
          <b>B-301+302</b> (green) on the AGC–GWL corridor. Manual override log updated.
        </div>
      )}

      <Card className="mb-3.5">
        <div className="px-4 py-3 border-b border-cream-200 flex items-center">
          <span className="text-[12.5px] font-semibold text-ink-900">Active Conflict · C-1</span>
          <span className="ml-auto text-[11px] text-ink-500">AGC–GWL corridor · Wed 04:00–10:00 overlap</span>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div className="bg-cream-100 border border-cream-300 rounded-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10.5px] font-semibold px-2 py-1 rounded flex items-center gap-1.5" style={{ background: '#EAF7F6', color: '#0B615C' }}>
                  <i className="w-1.5 h-1.5 rounded-sm inline-block" style={{ background: '#0F7A73' }} />
                  ENGINEERING
                </span>
                <span className="font-mono text-[9.5px] text-ink-500 border border-cream-300 px-1.5 py-0.5 rounded">SMMS</span>
              </div>
              <DRow k="Block request" v="B-301" />
              <DRow k="Defect" v="ENG-1042 · rail fracture" />
              <DRow k="Severity / overdue" v="Critical · 12 days" />
              <DRow k="Window" v="Wed 04:00 – 16:00" />
              <DRow k="Crew & assets" v="Gang-4 · PTR rail 60E1" />
            </div>
            <div className="bg-cream-100 border border-cream-300 rounded-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10.5px] font-semibold px-2 py-1 rounded flex items-center gap-1.5" style={{ background: '#F1ECF8', color: '#5E4380' }}>
                  <i className="w-1.5 h-1.5 rounded-sm inline-block" style={{ background: '#7C5AA6' }} />
                  SIGNAL &amp; TELECOM
                </span>
                <span className="font-mono text-[9.5px] text-ink-500 border border-cream-300 px-1.5 py-0.5 rounded">TDMS</span>
              </div>
              <DRow k="Block request" v="B-302" />
              <DRow k="Defect" v="SNT-0871 · signal failure" />
              <DRow k="Severity / overdue" v="High · 6 days" />
              <DRow k="Window" v="Wed 10:00 – 22:00" />
              <DRow k="Crew & assets" v="Sig-team-2 · relay rack" />
            </div>
          </div>

          <div className="flex gap-4 items-start bg-cream-100 border border-cream-300 rounded-card p-4">
            <div className="w-8 h-8 rounded-lg bg-[#EAF6EE] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3E8E5B" strokeWidth="2">
                <path d="M12 2a7 7 0 0 1 4 12.7V17a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-2.3A7 7 0 0 1 12 2z" />
                <path d="M9 21h6" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold mb-1 text-[12.5px]">
                Suggested resolution: <span className="text-[#2E6D44]">merge into combined block</span>
              </div>
              <div className="text-ink-500 text-[11px] leading-relaxed border-l-2 border-cream-300 pl-2.5">
                <b className="text-ink-900">Why: </b>crews don't share track assets (rail gang vs signal team),
                and the union window Wed 04:00–22:00 keeps both defects inside their SLA. Merging removes 8h
                of duplicate possession time and clears 2 conflict-hours.
              </div>
            </div>
          </div>

          {!resolved && (
            <>
              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={() => resolveConflict(aiMode ? 'ai' : 'accept')}
                  className="text-[11.5px] font-medium px-3.5 py-2 rounded-md text-white"
                  style={{ background: '#3E8E5B' }}
                >
                  ✓ Accept suggestion — merge blocks
                </button>
                <button
                  onClick={() => setShowOverride((v) => !v)}
                  className="text-[11.5px] font-medium px-3.5 py-2 rounded-md border"
                  style={{ borderColor: '#D9AFA3', color: '#A24A38' }}
                >
                  Manual override…
                </button>
              </div>
              {showOverride && (
                <div className="flex gap-2 mt-2.5 flex-wrap">
                  <OverrideBtn onClick={() => resolveConflict('Prioritise Engineering (S&T rescheduled Thu)')}>
                    Prioritise Engineering (S&amp;T rescheduled Thu)
                  </OverrideBtn>
                  <OverrideBtn onClick={() => resolveConflict('Prioritise S&T (ENG rescheduled Thu)')}>
                    Prioritise S&amp;T (ENG rescheduled Thu)
                  </OverrideBtn>
                  <OverrideBtn onClick={() => resolveConflict('Split window 04:00–13:00 / 13:00–22:00')}>
                    Split window 04:00–13:00 / 13:00–22:00
                  </OverrideBtn>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

function DRow({ k, v }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-cream-200 text-[11.5px] last:border-b-0">
      <span className="text-ink-500">{k}</span>
      <span className="num text-right text-ink-900">{v}</span>
    </div>
  );
}

function OverrideBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] font-medium bg-cream-50 border border-cream-300 px-3 py-1.5 rounded-md hover:bg-cream-200"
    >
      {children}
    </button>
  );
}
