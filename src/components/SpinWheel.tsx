import { useEffect, useRef } from "react";
import type { WheelPrize } from "@/lib/loyalty";

export function SpinWheel({
  prizes,
  mustSpin,
  targetIndex,
  onStopSpinning,
  size = 320,
}: {
  prizes: WheelPrize[];
  mustSpin: boolean;
  targetIndex: number;
  onStopSpinning: () => void;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const currentAngleRef = useRef<number>(0);
  const isSpinningRef = useRef<boolean>(false);

  // Draw static wheel when not spinning or prizes change
  useEffect(() => {
    if (!isSpinningRef.current) {
      drawWheel(currentAngleRef.current);
    }
  }, [prizes, size]);

  // Handle spin action when mustSpin becomes true
  useEffect(() => {
    if (mustSpin && !isSpinningRef.current && prizes.length > 0) {
      isSpinningRef.current = true;

      const numPrizes = prizes.length;
      const sliceAngle = (2 * Math.PI) / numPrizes;

      // Pointer is at top (- Math.PI / 2)
      // To land targetIndex under pointer: targetAngle = (3/2 * Math.PI) - (targetIndex + 0.5) * sliceAngle
      const targetSliceCenter = (3 * Math.PI) / 2 - (targetIndex + 0.5) * sliceAngle;

      // Ensure positive full rotations (e.g. 5 to 7 full spins)
      const fullSpins = 5 + Math.floor(Math.random() * 3);
      const startAngle = currentAngleRef.current % (2 * Math.PI);
      let finalTargetAngle = startAngle + fullSpins * 2 * Math.PI;

      // Adjust to hit target slice
      const remainder = finalTargetAngle % (2 * Math.PI);
      const diff = (targetSliceCenter - remainder + 4 * Math.PI) % (2 * Math.PI);
      finalTargetAngle += diff;

      const duration = 4500; // ms
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentAngle = startAngle + (finalTargetAngle - startAngle) * easeOut;

        currentAngleRef.current = currentAngle;
        drawWheel(currentAngle);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          isSpinningRef.current = false;
          onStopSpinning();
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mustSpin, targetIndex]);

  const drawWheel = (rotationAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 12;

    ctx.clearRect(0, 0, size, size);

    if (prizes.length === 0) return;

    const sliceAngle = (2 * Math.PI) / prizes.length;

    // Draw Outer Shadow Rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#1E293B";
    ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fill();
    ctx.restore();

    // Draw Wheel Slices
    prizes.forEach((prize, index) => {
      const start = rotationAngle + index * sliceAngle;
      const end = start + sliceAngle;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = prize.color || "#3B82F6";
      ctx.fill();

      // Slice border line
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.stroke();
      ctx.restore();

      // Draw Slice Text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(start + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = prize.textColor || "#FFFFFF";

      // Label (Primary text)
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.fillText(prize.label, radius - 20, -6);

      // Sublabel (Secondary text)
      if (prize.sublabel) {
        ctx.font = "500 10px Inter, sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.fillText(prize.sublabel, radius - 20, 10);
      }

      ctx.restore();
    });

    // Outer Decorative Dots
    const numDots = prizes.length * 2;
    for (let i = 0; i < numDots; i++) {
      const dotAngle = (i * Math.PI) / (numDots / 2);
      const dotX = centerX + (radius + 2) * Math.cos(dotAngle);
      const dotY = centerY + (radius + 2) * Math.sin(dotAngle);

      ctx.beginPath();
      ctx.arc(dotX, dotY, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? "#FCD34D" : "#FFFFFF";
      ctx.fill();
    }

    // Center Cap
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 8;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#0F172A";
    ctx.fill();
    ctx.restore();
  };

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      {/* Top Pointer Arrow */}
      <div className="absolute -top-3 z-20 drop-shadow-md">
        <div className="h-0 w-0 border-x-8 border-x-transparent border-t-[16px] border-t-amber-400" />
      </div>

      {/* Canvas Wheel */}
      <canvas
        ref={canvasRef}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="rounded-full transition-transform"
      />
    </div>
  );
}
