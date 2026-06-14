// @ts-nocheck
"use client";

import { ChefHat, Coffee, Pizza, Sandwich, UtensilsCrossed, Flame } from "lucide-react";
import { useEffect, useState } from "react";

const icons = [ChefHat, Coffee, Pizza, Sandwich, Flame, UtensilsCrossed];

export default function LoadingScreen({ text = "Preparing...", delay = 300 }) {
  const [show, setShow] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    // Only show loading screen after a delay to prevent flashing on fast loads
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setIconIndex((i) => (i + 1) % icons.length);
    }, 600); // Change icon every 600ms
    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  const Icon = icons[iconIndex];

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center space-y-8">
      <div className="relative flex items-center justify-center">
        {/* Animated Glow */}
        <div className="absolute inset-0 scale-[1.8] animate-pulse rounded-full bg-gradient-to-tr from-amber-300 to-orange-500 blur-2xl opacity-40" />
        
        {/* Floating Icon Container */}
        <div className="relative z-10 flex h-20 w-20 animate-bounce items-center justify-center rounded-3xl bg-white shadow-2xl ring-1 ring-slate-100">
          <Icon className="h-10 w-10 text-orange-500 transition-all duration-300" strokeWidth={2.5} />
        </div>
      </div>
      
      <p className="animate-pulse text-sm font-black uppercase tracking-[0.2em] text-navy-800">
        {text}
      </p>
    </div>
  );
}
