"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface LoadingLottieProps {
  size?: number;
  message?: string;
  className?: string;
}

export function LoadingLottie({
  size = 120,
  message,
  className = "",
}: LoadingLottieProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen min-w-screen gap-4 ${className}`}
    >
      <DotLottieReact
        src="/lotties/Loading.lottie"
        loop
        autoplay
        style={{ width: size, height: size }}
      />
      {message && (
        <p className="text-muted-foreground text-lg font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
