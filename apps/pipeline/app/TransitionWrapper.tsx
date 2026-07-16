"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function TransitionWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col">
      <AnimatePresence initial={false}>
        <motion.div
          key={pathname}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0, position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="flex-1 w-full flex flex-col"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
