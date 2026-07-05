"use client";

import { Input } from "@/components/ui/input";
import { normalizeMoneyText } from "@/lib/money";
import { cn } from "@/lib/utils";

interface MoneyInputProps
  extends Omit<
    React.ComponentProps<typeof Input>,
    "value" | "onChange" | "type" | "onPaste"
  > {
  value: string;
  onValueChange: (value: string) => void;
}

export function MoneyInput({
  value,
  onValueChange,
  className,
  placeholder = "0,00",
  onBlur,
  ...props
}: MoneyInputProps) {
  return (
    <div className="relative">
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        data-money
        placeholder={placeholder}
        className={cn("pr-7 text-right tabular-nums", className)}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={(e) => {
          const trimmed = value.trim();
          if (trimmed) onValueChange(normalizeMoneyText(trimmed));
          onBlur?.(e);
        }}
        onPaste={(e) => {
          e.preventDefault();
          onValueChange(normalizeMoneyText(e.clipboardData.getData("text")));
        }}
      />
      <span
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-sm text-muted-foreground"
        aria-hidden
      >
        €
      </span>
    </div>
  );
}
