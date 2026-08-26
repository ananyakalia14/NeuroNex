/* ── SplashScreen — Light Green Clean Intro Screen ──
   - Beautiful Light Green aesthetic matching the JeevaRaah logo
   - Large prominent Hero Logo
   - Animated GPS Emergency Route & Pulse
   - Clean, unobstructed presentation (loading bar removed)
*/

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './SplashScreen.css';

interface SplashScreenProps {
  isLoading: boolean;
  loadingPhase: string;
  loadingProgress: number;
  onComplete: () => void;
}

export function SplashScreen({
  onComplete,
}: SplashScreenProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Smooth intro animation, then transition to login page
    const timer = setTimeout(() => {
      setShow(false);
      onComplete();
    }, 900);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleSkip = () => {
    setShow(false);
    onComplete();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleSkip}
        >
          {/* Soft ambient light green halos */}
          <div className="splash__glow splash__glow--green" />
          <div className="splash__glow splash__glow--mint" />

          {/* Central Hero Presentation */}
          <div className="splash__content">
            {/* Prominent Large Logo */}
            <motion.div
              className="splash__logo-hero"
              initial={{ scale: 0.88, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <img
                src="/logo.png"
                alt="JeevaRaah — The right care. The right route. In time."
                className="splash__logo-img"
              />
            </motion.div>

            {/* Glowing GPS Route & Ambulance Lifeline Animation */}
            <motion.div
              className="splash__lifeline-wrapper"
              initial={{ opacity: 0, scaleX: 0.8 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              <svg className="splash__lifeline-svg" viewBox="0 0 600 60">
                {/* Background track */}
                <path
                  d="M 20 30 Q 160 10, 300 30 T 580 30"
                  fill="none"
                  stroke="rgba(27, 94, 32, 0.12)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                {/* Active animated stroke */}
                <motion.path
                  d="M 20 30 Q 160 10, 300 30 T 580 30"
                  fill="none"
                  stroke="url(#lightGreenRouteGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Gliding ambulance dot */}
                <motion.circle
                  r="6.5"
                  fill="#1B5E20"
                  filter="drop-shadow(0 0 6px rgba(46, 125, 50, 0.6))"
                  initial={{ offsetDistance: '0%' }}
                  animate={{ offsetDistance: '100%' }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ offsetPath: "path('M 20 30 Q 160 10, 300 30 T 580 30')" }}
                />
                <defs>
                  <linearGradient id="lightGreenRouteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1B5E20" />
                    <stop offset="50%" stopColor="#2E7D32" />
                    <stop offset="85%" stopColor="#3949AB" />
                    <stop offset="100%" stopColor="#1A237E" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
