import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];

// Wraps each page so it slides/fades between routes.
export function Page({ children, className = "" }) {
  return (
    <motion.main
      className={`page ${className}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease } }}
      exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
    >
      {children}
    </motion.main>
  );
}

// Fades content up when it scrolls into view.
export function Reveal({ children, delay = 0, className = "", as = "div", y = 32 }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease }}
    >
      {children}
    </Tag>
  );
}

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};
