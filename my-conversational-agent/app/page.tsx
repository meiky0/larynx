'use client';

import React from 'react';
import Widget from '../app/components/Widget';

export default function Page() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-100 font-sans">
      <div className="pt-16 px-6 text-center max-w-xl mx-auto">
        <p className="text-base leading-6 mb-6">
          Cross-platform generative-AI speech by Larynx.
        </p>

        <div className="bg-white/5 rounded-xl p-5 mb-6 max-w-md mx-auto">
          <h2 className="text-lg font-bold mb-4">Available Client Tools:</h2>

          <div className="border-b border-white/10 py-3 flex justify-between items-center">
            <span className="text-sm">Get battery level</span>
            <div className="flex gap-2 text-xs text-slate-300">
              <span className="bg-white/10 px-2 py-1 rounded">web</span>
              <span className="bg-white/10 px-2 py-1 rounded">ios</span>
              <span className="bg-white/10 px-2 py-1 rounded">android</span>
            </div>
          </div>

          <div className="border-b border-white/10 py-3 flex justify-between items-center">
            <span className="text-sm">Change screen brightness</span>
            <div className="flex gap-2 text-xs text-slate-300">
              <span className="bg-white/10 px-2 py-1 rounded">ios</span>
              <span className="bg-white/10 px-2 py-1 rounded">android</span>
            </div>
          </div>

          <div className="py-3 flex justify-between items-center">
            <span className="text-sm">Flash screen</span>
            <div className="flex gap-2 text-xs text-slate-300">
              <span className="bg-white/10 px-2 py-1 rounded">ios</span>
              <span className="bg-white/10 px-2 py-1 rounded">android</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating voice widget */}
      <Widget
        platform="web"
      />
    </div>
  );
}
