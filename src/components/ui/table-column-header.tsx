import type { ReactNode } from "react";
import { TableHead } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TableColumnHeaderProps {
  label: ReactNode;
  tooltip?: string;
  className?: string;
}

export function TableColumnHeader({
  label,
  tooltip,
  className,
}: TableColumnHeaderProps) {
  if (!tooltip) {
    return <TableHead className={className}>{label}</TableHead>;
  }

  return (
    <TableHead className={className}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-block cursor-help border-b border-dotted border-muted-foreground/60",
              "leading-tight"
            )}
          >
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-left">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TableHead>
  );
}
