"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

// Register the plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrambleTextPlugin);
}

interface ScrambleTextProps {
  text: string;
  className?: string;
  trigger?: "hover" | "mount";
  duration?: number;
  scrambleChars?: string;
}

export function ScrambleText({
  text,
  className = "",
  trigger = "hover",
  duration = 0.8,
  scrambleChars = "01!@#$%^&*()_+",
}: ScrambleTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const originalText = useRef(text);

  useEffect(() => {
    originalText.current = text;
    if (trigger === "mount") {
      performScramble();
    }
  }, [text, trigger]);

  const performScramble = () => {
    if (textRef.current) {
      gsap.to(textRef.current, {
        duration: duration,
        scrambleText: {
          text: originalText.current,
          chars: scrambleChars,
          revealDelay: 0.1,
          speed: 0.5,
        },
        ease: "power2.out",
      });
    }
  };

  const handleMouseEnter = () => {
    if (trigger === "hover") {
      performScramble();
    }
  };

  return (
    <span
      ref={textRef}
      className={className}
      onMouseEnter={handleMouseEnter}
    >
      {text}
    </span>
  );
}
