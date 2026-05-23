// src/components/bloque/BloqueActivoInmuebleSection.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActivoCaracteristica, BloqueCategoria } from "@/lib/bloqueTypes";
import {
  INMUEBLE_FIELD_GROUPS,
  INMUEBLE_FIELD_META,
  findInmueblesCategoriaId,
  type InmueblePlantillaSlug,
} from "@/lib/sanyusInmueblePlantilla";

interface Props {
  esInmueble: boolean;
  onEsInmuebleChange: (value: boolean) => void;
  onCategoriaAutoAssign: (categoriaId: string) => void;
  categorias: BloqueCategoria[];
  plantillaCaracteristicas: ActivoCaracteristica[];
  caracValores: Record<string, string>;
  setCaracValores: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

function slugToCaracteristicaId(
  plantilla: ActivoCaracteristica[],
  slug: InmueblePlantillaSlug,
): string | undefined {
  return plantilla.find((c) => c.slug === slug)?.id;
}

function InmuebleFieldInput({
  slug,
  caracId,
  value,
  onChange,
}: {
  slug: InmueblePlantillaSlug;
  caracId: string;
  value: string;
  onChange: (id: string, val: string) => void;
}) {
  const meta = INMUEBLE_FIELD_META[slug];
  const inputId = `inmueble-${slug}`;

  if (meta.type === "select" && meta.options) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={inputId}>{meta.label}</Label>
        <Select value={value || undefined} onValueChange={(v) => onChange(caracId, v)}>
          <SelectTrigger id={inputId}>
            <SelectValue placeholder={meta.label} />
          </SelectTrigger>
          <SelectContent>
            {meta.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (meta.type === "percent") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={inputId}>{meta.label}</Label>
        <div className="relative">
          <Input
            id={inputId}
            type="number"
            step={meta.step ?? "0.001"}
            min={meta.min ?? "0"}
            max={meta.max ?? "100"}
            value={value}
            onChange={(e) => onChange(caracId, e.target.value)}
            placeholder="0"
            className="pr-8"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            %
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{meta.label}</Label>
      <Input
        id={inputId}
        type={meta.type === "number" ? "number" : meta.type === "date" ? "date" : "text"}
        step={meta.step}
        min={meta.min}
        max={meta.max}
        value={value}
        onChange={(e) => onChange(caracId, e.target.value)}
        placeholder={meta.label}
      />
    </div>
  );
}

export default function BloqueActivoInmuebleSection({
  esInmueble,
  onEsInmuebleChange,
  onCategoriaAutoAssign,
  categorias,
  plantillaCaracteristicas,
  caracValores,
  setCaracValores,
}: Props) {
  const handleToggle = (checked: boolean) => {
    const next = checked === true;
    onEsInmuebleChange(next);
    if (next) {
      const inmueblesId = findInmueblesCategoriaId(categorias);
      if (inmueblesId) onCategoriaAutoAssign(inmueblesId);
    }
  };

  const setValor = (caracId: string, val: string) => {
    setCaracValores((prev) => ({ ...prev, [caracId]: val }));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Inmueble</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <span className="text-sm text-muted-foreground">Marcar como inmueble</span>
            <Switch checked={esInmueble} onCheckedChange={handleToggle} />
          </label>
        </CardContent>
      </Card>

      {esInmueble &&
        INMUEBLE_FIELD_GROUPS.map((group) => {
          const fields = group.slugs.map((slug) => {
            const caracId = slugToCaracteristicaId(plantillaCaracteristicas, slug);
            const valueKey = caracId ?? slug;
            return { slug, caracId, valueKey };
          });

          return (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle className="text-base">{group.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={
                    group.title === "Participación"
                      ? "grid grid-cols-1 sm:grid-cols-3 gap-4"
                      : "grid grid-cols-1 sm:grid-cols-2 gap-4"
                  }
                >
                  {fields.map(({ slug, caracId, valueKey }) => {
                    const meta = INMUEBLE_FIELD_META[slug];
                    const colClass =
                      meta.colSpan === 2 ? "sm:col-span-2" : meta.colSpan === 3 ? "sm:col-span-2" : "";
                    return (
                      <div key={slug} className={colClass}>
                        <InmuebleFieldInput
                          slug={slug}
                          caracId={valueKey}
                          value={caracValores[valueKey] ?? (caracId ? caracValores[caracId] ?? "" : "")}
                          onChange={setValor}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}
