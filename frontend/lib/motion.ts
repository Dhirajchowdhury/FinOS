import { Variants, Transition } from "framer-motion";

/**
 * FinOS Financial Motion Tokens & Easing Curves
 * Designed for precision, calm reactivity, and institutional clarity.
 */

export const FINOS_EASINGS = {
  easeOutExpo: [0.16, 1, 0.3, 1] as const,
  easeInOutCubic: [0.65, 0, 0.35, 1] as const,
  springGentle: { type: "spring", stiffness: 350, damping: 30 } as const,
  springSnappy: { type: "spring", stiffness: 450, damping: 25 } as const,
  springSubtle: { type: "spring", stiffness: 500, damping: 35 } as const,
};

export const defaultTransition: Transition = {
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1],
};

export const pageTransitionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.18,
      ease: "easeIn",
    },
  },
};

export const staggerContainer = (
  staggerChildren = 0.05,
  delayChildren = 0.02
): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 6,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

export const cardHoverVariants: Variants = {
  initial: { y: 0, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" },
  hover: {
    y: -3,
    boxShadow: "0 10px 24px -6px rgba(0, 0, 0, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.03)",
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
  tap: {
    scale: 0.985,
    y: 0,
    transition: { duration: 0.1 },
  },
};

export const buttonPressVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
  },
  tap: {
    scale: 0.97,
    transition: { duration: 0.08 },
  },
};
