import * as React from "react"

import { cn } from "@/lib/utils"

type SliderProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange"> & {
  value?: number[]
  defaultValue?: number[]
  onValueChange?: (value: number[]) => void
}

function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  disabled,
  ...props
}: SliderProps) {
  const minNum = Number(min)
  const maxNum = Number(max)
  const stepNum = Number(step)
  const currentNum = Number(value?.[0] ?? defaultValue?.[0] ?? minNum)
  const range = maxNum - minNum
  const safeRange = range === 0 ? 1 : range
  const pct = Math.max(0, Math.min(100, ((currentNum - minNum) / safeRange) * 100 || 0))
  const thumbSize = 20

  return (
    <div className={cn("relative w-full", className)}>
      <div className="bg-muted/70 pointer-events-none absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full" />
      <div
        className="bg-foreground pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
        style={{ width: `${pct}%` }}
      />
      <div
        className="bg-background pointer-events-none absolute top-1/2 z-10 rounded-full border border-muted-foreground/40 shadow-sm"
        style={{
          height: `${thumbSize}px`,
          width: `${thumbSize}px`,
          left: `clamp(${thumbSize / 2}px, ${pct}%, calc(100% - ${thumbSize / 2}px))`,
          transform: "translate(-50%, -50%)",
        }}
      />
      <input
        type="range"
        min={minNum}
        max={maxNum}
        step={stepNum}
        value={currentNum}
        disabled={disabled}
        className="slider-native relative z-20 h-6 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed"
        onChange={(e) => onValueChange?.([Number(e.target.value)])}
        {...props}
      />
      <style>{`
        .slider-native::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          opacity: 0;
        }

        .slider-native::-moz-range-thumb {
          width: 20px;
          height: 20px;
          opacity: 0;
          border: 0;
        }

        .slider-native::-webkit-slider-runnable-track {
          background: transparent;
          border: 0;
        }

        .slider-native::-moz-range-track {
          background: transparent;
          border: 0;
        }
      `}</style>
    </div>
  )
}

export { Slider }
