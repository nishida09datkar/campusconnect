import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ArrowRight } from 'lucide-react';

export const SPLASH_SESSION_KEY = 'campusconnect_splash_shown';

export const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<1 | 2>(1);

  useEffect(() => {
    // Respect prefers-reduced-motion: skip animation immediately
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sessionStorage.setItem(SPLASH_SESSION_KEY, 'true');
      navigate('/login', { replace: true });
      return;
    }

    // Phase 1 lasts ~5s, then crossfades into Phase 2
    const phaseTimer = setTimeout(() => {
      setPhase(2);
    }, 5000);

    // Phase 2 lasts ~5s (total 10s), then navigates to /login
    const finishTimer = setTimeout(() => {
      sessionStorage.setItem(SPLASH_SESSION_KEY, 'true');
      navigate('/login', { replace: true });
    }, 10000);

    return () => {
      clearTimeout(phaseTimer);
      clearTimeout(finishTimer);
    };
  }, [navigate]);

  const handleSkip = () => {
    sessionStorage.setItem(SPLASH_SESSION_KEY, 'true');
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center p-6 bg-gradient-to-br from-indigo-50/50 via-background to-purple-50/30 dark:from-background dark:via-background dark:to-muted/20 select-none overflow-hidden">
      {/* Subtle skip option for accessibility and quick access */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-6 right-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      >
        <span>Skip intro</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      <div className="w-full max-w-xl flex flex-col items-center justify-center min-h-[280px]">
        <AnimatePresence mode="wait">
          {phase === 1 ? (
            <motion.div
              key="phase-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1.0] }}
              className="flex flex-col items-center text-center space-y-5 px-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-600 dark:text-primary-400">
                <span>AY 2026-27 Institutional Portal</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif tracking-tight text-foreground/90 leading-snug">
                Unified Campus Communication &amp; Classroom Platform
              </h1>

              <div className="w-12 h-0.5 bg-primary-500/40 rounded-full" />

              <p className="text-xs sm:text-sm uppercase tracking-widest text-muted-foreground font-medium">
                Excellence in Academic Governance
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="phase-2"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1.0] }}
              className="flex flex-col items-center text-center space-y-4 px-4"
            >
              {/* Logo Badge matching LoginPage.tsx */}
              <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-2xl shadow-primary-500/30">
                <GraduationCap className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                  CampusConnect
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Academic Portal &bull; Enterprise Campus Network
                </p>
              </div>

              {/* Understated progress indicator */}
              <div className="w-24 h-1 bg-muted rounded-full overflow-hidden mt-4">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 4.8, ease: 'linear' }}
                  className="h-full bg-primary-600 rounded-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SplashPage;
