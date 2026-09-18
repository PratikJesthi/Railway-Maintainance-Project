import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { fmtWindow } from '../utils.js';

function Row({ k, v, bad, good }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-cream-300/70">{k}</span>
      <span className={'num ' + (bad ? 'text-red-300' : good ? 'text-emerald-300' : 'text-cream-50')}>{v}</span>
    </div>
  );
}

export default function ScenarioBar() {
  const { scenario, applyScenario, discardScenario, depts: DEPTS } = useApp();
  if (!scenario) return null;

  const dept = DEPTS[scenario.dept];
  const trains = scenario.conflictIds.length ? scenario.conflictIds.length * 14 : 0;
  const slaText =
    scenario.delayH > 0
      ? `delayed ${scenario.delayH}h → est. +${Math.max(1, Math.round(scenario.delayH / 24))} overdue day`
      : `pulled earlier ${-scenario.delayH}h ✓`;

  return (
    <div className="fixed left-1/2 bottom-5 -translate-x-1/2 w-[min(700px,94vw)] bg-ink-900 border border-ink-700 rounded-xl shadow-panel z-[60] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded bg-amber-900/70 text-amber-300">
          WHAT-IF
        </span>
        <span className="text-[12px] text-cream-50">
          Move <b>{scenario.id}</b> ({scenario.sec} · {dept?.name}) →{' '}
          <span className="num">{fmtWindow(scenario.newStart, scenario.dur)}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11.5px] mb-4">
        <Row k="Conflicts after move" v={scenario.conflictIds.length ? scenario.conflictIds.join(', ') : 'none ✓'} bad={scenario.conflictIds.length > 0} good={!scenario.conflictIds.length} />
        <Row k="Conflict delta" v={`${scenario.delta > 0 ? '+' : ''}${scenario.delta} ${scenario.delta > 0 ? '⚠' : '✓'}`} bad={scenario.delta > 0} good={scenario.delta <= 0} />
        <Row k="SLA impact" v={slaText} />
        <Row k="Trains affected (est.)" v={trains ? `${trains} path-holds` : '—'} />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={() => discardScenario(false)}
          className="text-[11.5px] px-3.5 py-1.5 rounded-md bg-ink-700/60 text-cream-100 hover:bg-ink-700"
        >
          Discard
        </button>
        <button
          onClick={applyScenario}
          className="text-[11.5px] px-3.5 py-1.5 rounded-md text-white font-medium hover:opacity-90"
          style={{ background: '#3E8E5B' }}
        >
          ✓ Apply scenario
        </button>
      </div>
    </div>
  );
}
