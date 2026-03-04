"use client";

import { cn } from "@/lib/utils";

interface HoloTypographyProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  variant?: "title" | "subtitle" | "highlight";
}

export function HoloTypography({ 
  children, 
  className, 
  variant = "title",
  ...props 
}: HoloTypographyProps) {
  
  // Enhanced holographic gradient (Smoother sweep: Cyan -> White highlight -> Cyan)
  const holoGradient = "bg-gradient-to-r from-cyan-400 via-white to-cyan-400 bg-[length:200%_auto] animate-shine bg-clip-text text-transparent transform translate-z-0";
  
  // Specific variants
  const variants = {
    title: "font-bold tracking-tight drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]",
    subtitle: "font-medium text-white/80",
    highlight: "font-extrabold tracking-tighter drop-shadow-[0_0_20px_rgba(6,182,212,0.6)] filter"
  };

  return (
    <span 
      className={cn(
        holoGradient, 
        variants[variant], 
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
