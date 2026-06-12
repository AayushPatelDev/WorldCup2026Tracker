// Confetti particle factories. Pure data — the FX components render the divs
// and CSS keyframes (transform/opacity only) do the motion.

const rand = (lo, hi) => lo + Math.random() * (hi - lo);

// Explosion from the centre of the screen (goal celebration).
export const confettiBurst = (colors, n = 40) =>
  Array.from({ length: n }, (_, id) => ({
    id,
    color: colors[id % colors.length],
    left: '50%',
    top: '52%',
    dx: `${rand(-44, 44)}vw`,
    dy: `${rand(-38, 30)}vh`,
    rot: `${rand(-540, 540)}deg`,
    dur: `${rand(1.1, 2.6)}s`,
    delay: `${rand(0, 0.3)}s`,
    w: rand(6, 14),
  }));

// Rain from the top of the screen (full-time celebration).
export const confettiRain = (colors, n = 56) =>
  Array.from({ length: n }, (_, id) => ({
    id,
    color: colors[id % colors.length],
    left: `${rand(0, 100)}%`,
    top: '-4%',
    dx: `${rand(-12, 12)}vw`,
    dy: '112vh',
    rot: `${rand(-900, 900)}deg`,
    dur: `${rand(2.2, 4)}s`,
    delay: `${rand(0, 1.2)}s`,
    w: rand(6, 13),
  }));
