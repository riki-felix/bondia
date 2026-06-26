import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchAddresses } from "@/lib/addressApi";
import {
  composePostalAddress,
  parsePostalAddress,
  suggestionToParts,
  type AddressSuggestion,
  type PostalAddressParts,
} from "@/lib/formatAddress";
import { cn } from "@/lib/utils";
import { Loader2, MapPin } from "lucide-react";

interface AddressAutocompleteProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  hint?: string;
}

export function AddressAutocomplete({
  id: idProp,
  label = "Dirección postal",
  value,
  onChange,
  disabled = false,
  className,
  hint = "Busca la calle y añade el número manualmente si no aparece en las sugerencias.",
}: AddressAutocompleteProps) {
  const autoId = useId();
  const baseId = idProp ?? autoId;
  const streetId = `${baseId}-street`;
  const numberId = `${baseId}-number`;
  const cityId = `${baseId}-city`;
  const listId = `${baseId}-suggestions`;

  const [parts, setParts] = useState<PostalAddressParts>(() => parsePostalAddress(value));
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const numberInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipValueSync = useRef(false);
  const partsRef = useRef(parts);
  partsRef.current = parts;

  useEffect(() => {
    if (skipValueSync.current) {
      skipValueSync.current = false;
      return;
    }
    setParts(parsePostalAddress(value));
  }, [value]);

  const emitChange = useCallback(
    (next: PostalAddressParts) => {
      setParts(next);
      skipValueSync.current = true;
      onChange(composePostalAddress(next));
    },
    [onChange]
  );

  const updatePart = (field: keyof PostalAddressParts, fieldValue: string) => {
    emitChange({ ...parts, [field]: fieldValue });
  };

  const fetchSuggestions = useCallback(async () => {
    const { street, number, city } = partsRef.current;
    const trimmed = street.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const searchQ = [street, number, city]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ");
      const results = await searchAddresses(searchQ);
      setSuggestions(results);
      setActiveIndex(results.length > 0 ? 0 : -1);
    } catch {
      setSuggestions([]);
      setActiveIndex(-1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || disabled) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions();
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [parts.street, open, disabled, fetchSuggestions]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectSuggestion = (item: AddressSuggestion) => {
    const picked = suggestionToParts(item);
    const next: PostalAddressParts = {
      street: picked.street,
      number: picked.number || parts.number,
      city: picked.city || parts.city,
    };
    emitChange(next);
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
    if (!picked.number) {
      numberInputRef.current?.focus();
    }
  };

  const onStreetKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={cn("space-y-1.5", className)} ref={containerRef}>
      <Label>{label}</Label>

      <div className="relative">
        <Label htmlFor={streetId} className="sr-only">
          Calle
        </Label>
        <Input
          id={streetId}
          value={parts.street}
          disabled={disabled}
          placeholder="Calle o avenida"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          onChange={(e) => {
            updatePart("street", e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onStreetKeyDown}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}

        {open && suggestions.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover py-1 shadow-md"
          >
            {suggestions.map((item, index) => (
              <li key={`${item.label}-${index}`} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent",
                    index === activeIndex && "bg-accent"
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(item)}
                >
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                  <span>
                    {item.label}
                    {!item.housenumber ? (
                      <span className="block text-xs text-muted-foreground">
                        Sin número — indícalo abajo
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,5rem)_1fr] gap-2">
        <div className="space-y-1">
          <Label htmlFor={numberId} className="text-xs text-muted-foreground">
            Número
          </Label>
          <Input
            ref={numberInputRef}
            id={numberId}
            value={parts.number}
            disabled={disabled}
            placeholder="Nº"
            inputMode="text"
            onChange={(e) => updatePart("number", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={cityId} className="text-xs text-muted-foreground">
            Ciudad
          </Label>
          <Input
            id={cityId}
            value={parts.city}
            disabled={disabled}
            placeholder="Ciudad o municipio"
            onChange={(e) => updatePart("city", e.target.value)}
          />
        </div>
      </div>

      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
