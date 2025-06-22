"use client";
import { cn } from "@/utils/cn";
import React, { useEffect, useRef, useState } from "react";
import { createNoise3D } from "simplex-noise";

export const NewBackground = ({
  children,
  className,
  containerClassName,
  colors,
  waveWidth = 100,
  backgroundFill,
  blur = 30,
  speed = "slow",
  waveOpacity = 0.3,
  ...props
}: {
  children?: any;
  className?: string;
  containerClassName?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: "slow" | "fast";
  waveOpacity?: number;
  [key: string]: any;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationId = useRef<number>();
  const noise = createNoise3D();
  const wRef = useRef<number>(0);
  const hRef = useRef<number>(0);
  const ntRef = useRef<number>(0);
  const ctxRef = useRef<any>(null);
  const canvasInstanceRef = useRef<any>(null);

  const getSpeed = () => {
    switch (speed) {
      case "slow":
        return 0.0004;
      case "fast":
        return 0.0006;
      default:
        return 0.0003;
    }
  };

  const init = () => {
    canvasInstanceRef.current = canvasRef.current;
    ctxRef.current = canvasInstanceRef.current.getContext("2d");
    wRef.current = ctxRef.current.canvas.width = window.innerWidth;
    hRef.current = ctxRef.current.canvas.height = window.innerHeight;
    ctxRef.current.filter = `blur(${blur}px)`;
    ntRef.current = 0;
  };

  const waveColors = colors ?? ["#FFA500", "#FF4500", "#FF6347"]; // Orange, Red-Orange, Yellow-Orange
  const drawWave = (n: number) => {
    ntRef.current += getSpeed();
    for (let i = 0; i < n; i++) {
      ctxRef.current.beginPath();
      ctxRef.current.lineWidth = waveWidth;
      ctxRef.current.strokeStyle = waveColors[i % waveColors.length];
      for (let x = 0; x < wRef.current; x += 5) {
        var y = noise(x / 400, 0.3 * i, ntRef.current) * 200;
        ctxRef.current.lineTo(x, y + hRef.current * 0.5);
      }
      ctxRef.current.stroke();
      ctxRef.current.closePath();
    }
  };

  const render = () => {
    ctxRef.current.fillStyle = backgroundFill || "black";
    ctxRef.current.globalAlpha = waveOpacity;
    ctxRef.current.fillRect(0, 0, wRef.current, hRef.current);
    drawWave(3);
  };

  useEffect(() => {
    const handleResize = () => {
      wRef.current = ctxRef.current.canvas.width = window.innerWidth;
      hRef.current = ctxRef.current.canvas.height = window.innerHeight;
      ctxRef.current.filter = `blur(${blur}px)`;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [blur]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omitting init and render to prevent reinitialization
  useEffect(() => {
    init();
    const animate = () => {
      animationId.current = requestAnimationFrame(animate);
      render();
    };
    animate();
    return () => {
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    setIsSafari(
      typeof window !== "undefined" &&
        navigator.userAgent.includes("Safari") &&
        !navigator.userAgent.includes("Chrome")
    );
  }, []);

  return (
    <div
      className={cn(
        "fixed h-full w-full inset-0 overflow-hidden",
        containerClassName
      )}
    >
      <canvas
        className="absolute inset-0 z-[-1]"
        ref={canvasRef}
        id="canvas"
        style={{
          ...(isSafari ? { filter: `blur(${blur}px)` } : {}),
        }}
      ></canvas>
      <div className={cn("relative z-10", className)} {...props}>
        {children}
      </div>
    </div>
  );
};

NewBackground.displayName = "NewBackground";

export default NewBackground;