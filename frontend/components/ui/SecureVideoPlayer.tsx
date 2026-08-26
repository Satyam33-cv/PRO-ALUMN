"use client";

import { useState, useEffect } from "react";
import { ShieldAlert } from "lucide-react";

interface SecureVideoPlayerProps {
  videoSrc: string;
  userEmail: string;
}

export function SecureVideoPlayer({ videoSrc, userEmail }: SecureVideoPlayerProps) {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [watermarkPos, setWatermarkPos] = useState({ top: 10, left: 10 });

  // Floating Watermark Logic
  useEffect(() => {
    if (!hasAgreed) return;

    const interval = setInterval(() => {
      // Generate random positions between 5% and 85% to keep it inside the player
      const randomTop = Math.floor(Math.random() * 80) + 5;
      const randomLeft = Math.floor(Math.random() * 80) + 5;
      setWatermarkPos({ top: randomTop, left: randomLeft });
    }, 4000); // Moves every 4 seconds

    return () => clearInterval(interval);
  }, [hasAgreed]);

  // 1. The Copyright Gate (Shown before agreement)
  if (!hasAgreed) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-slate-900 rounded-2xl p-8 text-center text-white border border-red-900/50 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-red-900/20 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-3">Copyright & Fair Use Agreement</h3>
          
          <div className="text-slate-300 mb-8 space-y-4 max-w-lg mx-auto text-sm leading-relaxed">
            <p>
              This educational content is the intellectual property of the alumni creator. By proceeding, you explicitly agree that you will not:
            </p>
            <ul className="text-left bg-slate-800/50 p-5 rounded-xl border border-slate-700 space-y-3 shadow-inner">
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold mt-0.5">•</span>
                <span>Screen record, capture, or download this video material.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold mt-0.5">•</span>
                <span>Distribute or share access outside the PRO ALUMN platform.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold mt-0.5">•</span>
                <span><strong className="text-white font-semibold">Violations will result in an immediate permanent ban and institutional reporting.</strong></span>
              </li>
            </ul>
            <p className="text-xs text-slate-400 pt-2">
              Note: Your session is protected by a dynamic forensic watermark identifying your account.
            </p>
          </div>

          <button 
            onClick={() => setHasAgreed(true)}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg hover:shadow-red-900/50 w-full sm:w-auto"
          >
            I Agree, Proceed to Video
          </button>
        </div>
      </div>
    );
  }

  // 2. The Secure Video Player (Shown after agreement)
  return (
    <div className="relative w-full max-w-3xl mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800/50">
      
      {/* The Video */}
      <video 
        src={videoSrc} 
        controls 
        controlsList="nodownload" // Basic HTML5 deterrent
        className="w-full h-auto aspect-video object-cover bg-slate-900"
      />

      {/* The Dynamic Watermark */}
      <div 
        className="absolute z-50 pointer-events-none select-none transition-all duration-[2000ms] ease-in-out"
        style={{ 
          top: `${watermarkPos.top}%`, 
          left: `${watermarkPos.left}%`,
          opacity: 0.35 // Faint enough to ignore, strong enough to read
        }}
      >
        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg -rotate-6 flex flex-col items-center">
          <p className="text-white font-mono text-[11px] sm:text-xs font-bold tracking-widest leading-none drop-shadow-md">
            {userEmail}
          </p>
          <p className="text-red-400 font-mono text-[9px] sm:text-[10px] font-bold tracking-widest leading-none mt-1 uppercase">
            Do Not Record
          </p>
        </div>
      </div>

    </div>
  );
}
