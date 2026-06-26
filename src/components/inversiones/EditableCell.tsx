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
import {
  formatEuro,
  formatMoneyEdit,
  normalizeMoneyText,
  parseMoneyInput,
  roundMoney2,
  toNum,
} from "@/lib/moneyCalc";

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

function moneyDraftFromValue(value: unknown): string {
  return formatMoneyEdit(value);
}

function estadoVariant(
  estado: string | null
): "default" | "secondary" | "success" | "warning" | "destructive" | "outline" {
  switch (estado?.toLowerCase()) {
    case "borrador":
      return "outline";
    case "activa":
      return "default";
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
  /** Opción vacía mostrada cuando no hay valor (p. ej. "Elige propiedad") */
  selectPlaceholder?: Option;
  onSave: (newValue: unknown) => void;
  className?: string;
  highlight?: boolean;
}

// ─── Component ───────────────────────────────────────────────

export function EditableCell({
  value,
  type,
  options = [],
  selectPlaceholder,
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
      const trimmed = draft.trim();
      const normalized = trimmed ? normalizeMoneyText(draft) : "";
      const parsed = parseMoneyInput(normalized);
      const next = trimmed === "" ? 0 : (parsed ?? 0);
      const prev = roundMoney2(toNum(value));
      if (next !== prev) onSave(next);
    } else if (type === "date") {
      const v = draft.trim() || null;
      if (v !== value) onSave(v);
    } else {
      const v = draft.trim() || null;
      if (v !== value) onSave(v);
    }
  }, [draft, value, type, onSave]);

  const handleMoneyBlur = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed) {
      const normalized = normalizeMoneyText(draft);
      if (normalized !== draft) setDraft(normalized);
    }
    commit();
  }, [draft, commit]);

  const handleMoneyPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text");
      setDraft(normalizeMoneyText(pasted));
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (type === "money" && draft.trim()) {
          const normalized = normalizeMoneyText(draft);
          setDraft(normalized);
          setEditing(false);
          const parsed = parseMoneyInput(normalized);
          const next = parsed ?? 0;
          const prev = roundMoney2(toNum(value));
          if (next !== prev) onSave(next);
          return;
        }
        commit();
      }
      if (e.key === "Escape") {
        setDraft(
          type === "money" ? moneyDraftFromValue(value) : String(value ?? "")
        );
        setEditing(false);
      }
    },
    [commit, value, type, draft]
  );

  const bgClass = highlight ? "bg-yellow-50" : "";

  // ── Readonly money (calculated fields) ──
  if (type === "readonly-money") {
    return (
      <span
        data-money
        className={`block w-full text-right tabular-nums text-sm ${className}`}
      >
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
    const emptyValue = selectPlaceholder?.value ?? "";
    const hasValue =
      value != null && String(value).trim() !== "" && String(value) !== emptyValue;
    const selectValue = hasValue ? String(value) : emptyValue;
    const allOptions = selectPlaceholder
      ? [selectPlaceholder, ...options]
      : options;
    const currentLabel =
      allOptions.find((o) => o.value === selectValue)?.label ??
      (hasValue ? String(value) : selectPlaceholder?.label ?? "—");

    return (
      <Select
        value={selectValue}
        onValueChange={(val) => {
          if (selectPlaceholder && val === selectPlaceholder.value) {
            onSave(null);
            return;
          }
          onSave(val);
        }}
      >
        <SelectTrigger
          className={`h-7 min-w-[100px] border-0 bg-transparent shadow-none text-sm px-1 ${
            selectPlaceholder && !hasValue ? "text-muted-foreground" : ""
          }`}
        >
          {type === "badge-select" ? (
            <Badge variant={estadoVariant(value as string | null)}>
              {currentLabel}
            </Badge>
          ) : (
            <SelectValue>{currentLabel}</SelectValue>
          )}
        </SelectTrigger>
        <SelectContent>
          {allOptions.map((opt) => (
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
      const text = value != null ? String(value).trim() : "";
      display = text ? String(value) : "—";
    }

    return (
      <div
        data-money={type === "money" || undefined}
        data-editable={type === "money" || type === "date" || type === "text" || undefined}
        className={`cursor-pointer rounded px-1 py-0.5 hover:bg-muted/60 min-h-[28px] w-full flex items-center ${
          type === "money" ? "justify-end text-right tabular-nums" : ""
        } ${bgClass} ${className}`}
        onClick={() => {
          setDraft(
            type === "money"
              ? moneyDraftFromValue(value)
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
      type={type === "date" ? "date" : "text"}
      data-money={type === "money" || undefined}
      className={`h-7 w-full text-sm ${
        type === "money" ? "text-right tabular-nums" : ""
      } ${bgClass} ${className}`}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={type === "money" ? handleMoneyBlur : commit}
      onPaste={type === "money" ? handleMoneyPaste : undefined}
      onKeyDown={handleKeyDown}
      inputMode={type === "money" ? "decimal" : undefined}
    />
  );
}
