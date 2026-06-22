import { useReducedMotion } from "motion/react";

export const MOTION_EASE = [0.4, 0, 0.2, 1] as [number, number, number, number];

export function useMotionTransition(duration = 0.22) {
  const reduceMotion = useReducedMotion();

  return {
    duration: reduceMotion ? 0 : duration,
    ease: MOTION_EASE,
  };
}

export function useMotionSpring() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return { duration: 0 };
  }

  return {
    type: "spring" as const,
    stiffness: 420,
    damping: 36,
    mass: 0.85,
  };
}
