import { useEffect, useRef, useState } from "react";
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
  const [pointerTick, setPointerTick] = useState<number>(0);

  // Redraw when not spinning or prizes/size change
  useEffect(() => {
    if (!isSpinningRef.current) {
      drawWheel(currentAngleRef.current, 0);
    }
  }, [prizes, size]);

  // Handle spin action
  useEffect(() => {
    if (mustSpin && !isSpinningRef.current && prizes.length > 0) {
      isSpinningRef.current = true;

      const numPrizes = prizes.length;
      const sliceAngle = (2 * Math.PI) / numPrizes;

      // Pointer is at the top (- Math.PI / 2)
      const targetSliceCenter = (3 * Math.PI) / 2 - (targetIndex + 0.5) * sliceAngle;

      // 6 to 8 full spins
      const fullSpins = 6 + Math.floor(Math.random() * 2);
      const startAngle = currentAngleRef.current % (2 * Math.PI);
      let finalTargetAngle = startAngle + fullSpins * 2 * Math.PI;

      // Align slice under the pointer
      const remainder = finalTargetAngle % (2 * Math.PI);
      const diff = (targetSliceCenter - remainder + 4 * Math.PI) % (2 * Math.PI);
      finalTargetAngle += diff;

      const duration = 5000; // ms
      const startTime = performance.now();
      let lastSlicePassed = -1;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Quintic Ease-out for exciting deceleration
        const easeOut = 1 - Math.pow(1 - progress, 4);
        const currentAngle = startAngle + (finalTargetAngle - startAngle) * easeOut;

        currentAngleRef.current = currentAngle;
        drawWheel(currentAngle, elapsed);

        // Calculate pointer tick when passing pins
        const currentSlice = Math.floor((currentAngle / sliceAngle) % numPrizes);
        if (currentSlice !== lastSlicePassed && progress < 0.95) {
          lastSlicePassed = currentSlice;
          setPointerTick((prev) => (prev === 0 ? 8 : -8));
          setTimeout(() => setPointerTick(0), 60);
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          isSpinningRef.current = false;
          setPointerTick(0);
          drawWheel(finalTargetAngle, 0);
          onStopSpinning();
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mustSpin, targetIndex]);

  const drawWheel = (rotationAngle: number, timeMs: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const outerRimWidth = 14;
    const wheelRadius = size / 2 - outerRimWidth - 4;

    ctx.clearRect(0, 0, size, size);

    if (prizes.length === 0) return;

    const sliceAngle = (2 * Math.PI) / prizes.length;

    // 1. OUTER GOLDEN BEZEL (Moldura Dourada Metálica 3D)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, wheelRadius + outerRimWidth, 0, 2 * Math.PI);
    const goldGrad = ctx.createLinearGradient(0, 0, size, size);
    goldGrad.addColorStop(0, "#D97706");
    goldGrad.addColorStop(0.25, "#FDE68A");
    goldGrad.addColorStop(0.5, "#B45309");
    goldGrad.addColorStop(0.75, "#FEF3C7");
    goldGrad.addColorStop(1, "#92400E");
    ctx.fillStyle = goldGrad;
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
    ctx.fill();

    // Inner bevel ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, wheelRadius + 2, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 2. WHEEL SLICES WITH GRADIENTS & GOLDEN DIVIDERS
    prizes.forEach((prize, index) => {
      const start = rotationAngle + index * sliceAngle;
      const end = start + sliceAngle;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, wheelRadius, start, end);
      ctx.closePath();

      // Radial slice gradient for depth
      const sliceGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        wheelRadius * 0.15,
        centerX,
        centerY,
        wheelRadius,
      );
      const baseColor = prize.color || "#3B82F6";
      sliceGrad.addColorStop(0, adjustBrightness(baseColor, 25));
      sliceGrad.addColorStop(1, baseColor);

      ctx.fillStyle = sliceGrad;
      ctx.fill();

      // Gold Trim Divider between slices
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "rgba(254, 240, 138, 0.75)";
      ctx.stroke();
      ctx.restore();

      // 3. PRIZE LABELS WITH HIGH-CONTRAST BADGE & SHARP TYPOGRAPHY
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(start + sliceAngle / 2);

      // Radial distance from center for text
      const textRadius = wheelRadius * 0.62;

      // Draw high-contrast translucent pill behind the text for crystal clear readability
      const pillWidth = wheelRadius * 0.58;
      const pillHeight = prize.sublabel ? 34 : 26;
      const pillX = textRadius - pillWidth / 2;
      const pillY = -pillHeight / 2;

      ctx.save();
      ctx.beginPath();
      // Rounded pill rect
      const pillRadius = 8;
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillRadius);
      ctx.fillStyle = "rgba(10, 15, 29, 0.55)";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(254, 240, 138, 0.45)";
      ctx.stroke();
      ctx.restore();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Shadow for text depth
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      // Main Prize Label (Grande, negrito e fácil de ler de longe!)
      const labelY = prize.sublabel ? -6 : 0;
      ctx.font = "900 15px Inter, -apple-system, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(prize.label, textRadius, labelY);

      // Sublabel (ex: "Desconto / L" ou "Na Conveniência")
      if (prize.sublabel) {
        ctx.font = "800 10.5px Inter, -apple-system, sans-serif";
        ctx.fillStyle = "#FEF08A"; // Tom amarelo-ouro de alto contraste
        ctx.fillText(prize.sublabel, textRadius, 9);
      }

      ctx.restore();
    });

    // 4. GOLDEN PEGS & LED BULBS ON THE RIM
    const numLights = 18;
    const isBlinking = isSpinningRef.current && Math.floor(timeMs / 100) % 2 === 0;

    for (let i = 0; i < numLights; i++) {
      const angle = (i * 2 * Math.PI) / numLights;
      const lightX = centerX + (wheelRadius + outerRimWidth / 2) * Math.cos(angle);
      const lightY = centerY + (wheelRadius + outerRimWidth / 2) * Math.sin(angle);

      ctx.save();
      ctx.beginPath();
      ctx.arc(lightX, lightY, 3.5, 0, 2 * Math.PI);

      const isActive = (i + (isBlinking ? 1 : 0)) % 2 === 0;
      if (isActive) {
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = "#FEF08A";
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = "#F59E0B";
        ctx.shadowColor = "rgba(245, 158, 11, 0.5)";
        ctx.shadowBlur = 4;
      }
      ctx.fill();

      // Metal ring around bulb
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.stroke();
      ctx.restore();
    }

    // 5. CENTER GEM & HUB (Centro Dourado Sofisticado com Estrela)
    ctx.save();
    // Outer Center Gold Ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
    const centerGold = ctx.createLinearGradient(centerX - 28, centerY - 28, centerX + 28, centerY + 28);
    centerGold.addColorStop(0, "#FEF3C7");
    centerGold.addColorStop(0.5, "#D97706");
    centerGold.addColorStop(1, "#78350F");
    ctx.fillStyle = centerGold;
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.fill();

    // Center Core (Navy escuro com reflexo de joia)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    const coreGrad = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, 20);
    coreGrad.addColorStop(0, "#1E293B");
    coreGrad.addColorStop(1, "#090D16");
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // Star in the center
    drawStar(ctx, centerX, centerY, 5, 8, 4, "#F59E0B");
    ctx.restore();
  };

  return (
    <div className="relative inline-flex flex-col items-center justify-center p-3">
      {/* Background Glow Effect */}
      <div className="absolute inset-0 m-auto h-[90%] w-[90%] rounded-full bg-emerald-500/25 blur-2xl -z-10 pointer-events-none" />

      {/* Realistic 3D Pointer Arrow at the Top */}
      <div
        className="absolute -top-3.5 z-30 transition-transform duration-75 drop-shadow-xl"
        style={{ transform: `rotate(${pointerTick}deg)` }}
      >
        <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer Gold Arrow Body */}
          <path
            d="M17 40L3.5 12C2 8.5 4.5 5 8.5 5H25.5C29.5 5 32 8.5 30.5 12L17 40Z"
            fill="url(#arrow_gold)"
            stroke="#78350F"
            strokeWidth="1.5"
          />
          {/* Center Ruby Gem */}
          <circle cx="17" cy="14" r="5" fill="url(#ruby_gem)" stroke="#450A0A" strokeWidth="1" />
          <circle cx="15.5" cy="12.5" r="1.5" fill="#FFFFFF" opacity="0.8" />
          <defs>
            <linearGradient id="arrow_gold" x1="17" y1="5" x2="17" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FEF08A" />
              <stop offset="0.4" stopColor="#F59E0B" />
              <stop offset="1" stopColor="#B45309" />
            </linearGradient>
            <radialGradient id="ruby_gem" cx="0.3" cy="0.3" r="0.7">
              <stop stopColor="#F87171" />
              <stop offset="0.6" stopColor="#DC2626" />
              <stop offset="1" stopColor="#7F1D1D" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Canvas Wheel */}
      <canvas
        ref={canvasRef}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="rounded-full select-none"
      />
    </div>
  );
}

// Helper: Adjust Hex Color Brightness
function adjustBrightness(hex: string, percent: number) {
  if (!hex || !hex.startsWith("#")) return hex;
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

// Helper: Draw 5-Pointed Star
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  fillColor: string,
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
}
