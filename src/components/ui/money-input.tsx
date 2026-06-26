"use client";

import { Input } from "@/components/ui/input";
import { normalizeMoneyText } from "@/lib/money";
import { cn } from "@/lib/utils";

interface MoneyInputProps
  extends Omit<
    React.ComponentProps<typeof Input>,
    "value" | "onChange" | "type" | "onBlur" | "onPaste"
  > {
  value: string;
  onValueChange: (value: string) => void;
}

export function MoneyInput({
  value,
  onValueChange,
  className,
  ...props
}: MoneyInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      data-money
      className={cn("text-right tabular-nums", className)}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      onBlur={() => {
        const trimmed = value.trim();
        if (trimmed) onValueChange(normalizeMoneyText(trimmed));
      }}
      onPaste={(e) => {
        e.preventDefault();
        onValueChange(normalizeMoneyText(e.clipboardData.getData("text")));
      }}
    />
  );
}
