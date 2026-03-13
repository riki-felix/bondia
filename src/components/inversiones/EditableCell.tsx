// src/components/inversiones/EditableCell.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatEuro, toNum } from "@/lib/moneyCalc";

// ─── Formatters ──────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
}

function fmtMoney(value: number | null): string {
  if (value == null) return "—";
  return formatEuro(value);
}

function estadoVariant(
  estado: string | null
): "default" | "secondary" | "success" | "warning" | "destructive" | "outline" {
  switch (estado?.toLowerCase()) {
    case "vendido":
      return "success";
    case "comprado":
      return "default";
    case "alquiler":
      return "secondary";
    case "tanteo":
    case "negociacion":
      return "warning";
    case "reforma":
      return "outline";
    default:
      return "secondary";
  }
}

// ─── Types ───────────────────────────────────────────────────

export type CellType =
  | "text"
  | "money"
  | "date"
  | "select"
  | "checkbox"
  | "badge-select"
  | "readonly-money";

interface Option {
  value: string;
  label: string;
}

interface EditableCellProps {
  value: unknown;
  type: CellType;
  options?: Option[];
  onSave: (newValue: unknown) => void;
  className?: string;
  highlight?: boolean;
}

// ─── Component ───────────────────────────────────────────────

export function EditableCell({
  value,
  type,
  options = [],
  onSave,
  className = "",
  highlight = false,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    if (type === "money") {
      const n = toNum(draft);
      if (n !== toNum(value)) onSave(n);
    } else if (type === "date") {
      const v = draft.trim() || null;
      if (v !== value) onSave(v);
    } else {
      const v = draft.trim() || null;
      if (v !== value) onSave(v);
    }
  }, [draft, value, type, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") {
        setDraft(String(value ?? ""));
        setEditing(false);
      }
    },
    [commit, value]
  );

  const bgClass = highlight ? "bg-yellow-50" : "";

  // ── Readonly money (calculated fields) ──
  if (type === "readonly-money") {
    return (
      <span data-money className={`text-right tabular-nums text-sm ${className}`}>
        {fmtMoney(value as number | null)}
      </span>
    );
  }

  // ── Checkbox ──
  if (type === "checkbox") {
    return (
      <div className="flex justify-center">
        <Checkbox
          checked={!!value}
          onCheckedChange={(checked) => onSave(!!checked)}
        />
      </div>
    );
  }

  // ── Select (inline) ──
  if (type === "select" || type === "badge-select") {
    const currentLabel =
      options.find((o) => o.value === String(value ?? ""))?.label ??
      String(value ?? "—");

    return (
      <Select
        value={String(value ?? "")}
        onValueChange={(val) => onSave(val)}
      >
        <SelectTrigger className="h-7 min-w-[100px] border-0 bg-transparent shadow-none text-sm px-1">
          {type === "badge-select" ? (
            <Badge variant={estadoVariant(value as string | null)}>
              {currentLabel}
            </Badge>
          ) : (
            <SelectValue>{currentLabel}</SelectValue>
          )}
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // ── Text / Money / Date — view mode ──
  if (!editing) {
    let display: string;
    if (type === "money") {
      display = fmtMoney(value as number | null);
    } else if (type === "date") {
      display = fmtDate(value as string | null);
    } else {
      display = value != null ? String(value) : "—";
    }

    return (
      <div
        data-money={type === "money" || undefined}
        className={`cursor-pointer rounded px-1 py-0.5 hover:bg-muted/60 min-h-[28px] flex items-center ${
          type === "money" ? "justify-end tabular-nums" : ""
        } ${bgClass} ${className}`}
        onClick={() => {
          setDraft(
            type === "money"
              ? value != null
                ? String(value)
                : ""
              : String(value ?? "")
          );
          setEditing(true);
        }}
      >
        <span className="text-sm">{display}</span>
      </div>
    );
  }

  // ── Edit mode ──
  return (
    <Input
      ref={inputRef}
      type={type === "date" ? "date" : type === "money" ? "text" : "text"}
      className={`h-7 text-sm ${type === "money" ? "text-right" : ""} ${bgClass} ${className}`}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      inputMode={type === "money" ? "decimal" : undefined}
    />
  );
}
