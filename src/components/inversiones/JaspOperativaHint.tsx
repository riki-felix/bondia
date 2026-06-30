import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatEuro } from "@/lib/moneyCalc";
import type { Property } from "@/lib/propertyTypes";
import { jaspBreakdownForProperty } from "@/lib/inversionOperativa";

interface JaspOperativaHintProps {
  row: Property;
  children: ReactNode;
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="text-primary-foreground/80">{label}</span>
      <span data-money className="tabular-nums font-medium text-primary-foreground">
        {value}
      </span>
    </div>
  );
}

export function JaspOperativaHint({ row, children }: JaspOperativaHintProps) {
  const b = jaspBreakdownForProperty(row);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">{children}</div>
        </TooltipTrigger>
        <TooltipContent side="left" className="w-64 space-y-2 p-3">
          <p className="text-xs font-semibold text-primary-foreground">
            JASP — desglose operativo
          </p>
          <Line label="Contable (factura)" value={formatEuro(b.jaspContable)} />
          <Line label="Dar por cobrado" value={formatEuro(b.darPorCobrado)} />
          <Line label="Real" value={formatEuro(b.jaspReal)} />
          <div className="space-y-1 border-t border-primary-foreground/25 pt-2">
            <Line label="Base imponible" value={formatEuro(b.baseImponible)} />
            <Line label="IVA 21%" value={formatEuro(b.iva)} />
            <Line label="Neto" value={formatEuro(b.neto)} />
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
