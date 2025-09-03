"use client";
import { motion, AnimatePresence } from "framer-motion";

export default function PageTransitionOverlay({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.6, ease: [0.77, 0, 0.175, 1] }}
          className="fixed inset-0 z-[9999] bg-black"
        />
      )}
    </AnimatePresence>
  );
}
