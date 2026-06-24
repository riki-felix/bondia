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
import type { ActivoCaracteristica } from "@/lib/bloqueTypes";
import {
  INMUEBLE_ESTADO_VENDIDO,
  INMUEBLE_FIELD_GROUPS,
  INMUEBLE_FIELD_META,
  type InmueblePlantillaSlug,
} from "@/lib/sanyusInmueblePlantilla";

interface Props {
  esInmueble: boolean;
  onEsInmuebleChange: (value: boolean) => void;
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

function getFieldValue(
  slug: InmueblePlantillaSlug,
  plantilla: ActivoCaracteristica[],
  caracValores: Record<string, string>,
): string {
  const caracId = slugToCaracteristicaId(plantilla, slug);
  const valueKey = caracId ?? slug;
  return caracValores[valueKey] ?? (caracId ? caracValores[caracId] ?? "" : "");
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

function groupGridClass(title: string): string {
  if (title === "Identificación") return "grid grid-cols-1 sm:grid-cols-2 gap-4";
  if (title === "Características") return "grid grid-cols-1 sm:grid-cols-3 gap-4";
  if (title === "Participación") return "grid grid-cols-1 sm:grid-cols-3 gap-4";
  return "grid grid-cols-1 sm:grid-cols-2 gap-4";
}

export default function BloqueActivoInmuebleSection({
  esInmueble,
  onEsInmuebleChange,
  plantillaCaracteristicas,
  caracValores,
  setCaracValores,
}: Props) {
  const handleToggle = (checked: boolean) => {
    onEsInmuebleChange(checked === true);
  };

  const setValor = (caracId: string, val: string) => {
    setCaracValores((prev) => ({ ...prev, [caracId]: val }));
  };

  const estadoValor = getFieldValue("estado", plantillaCaracteristicas, caracValores);
  const isVendido = estadoValor === INMUEBLE_ESTADO_VENDIDO;

  const renderField = (slug: InmueblePlantillaSlug) => {
    const caracId = slugToCaracteristicaId(plantillaCaracteristicas, slug);
    const valueKey = caracId ?? slug;
    return (
      <InmuebleFieldInput
        key={slug}
        slug={slug}
        caracId={valueKey}
        value={getFieldValue(slug, plantillaCaracteristicas, caracValores)}
        onChange={setValor}
      />
    );
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
          if (group.title === "Estado") {
            return (
              <Card key={group.title}>
                <CardHeader>
                  <CardTitle className="text-base">{group.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      {renderField("estado")}
                      {isVendido && renderField("precio_venta")}
                    </div>
                    <div className="space-y-4">
                      {renderField("ocupado")}
                      {isVendido && renderField("fecha_venta")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          return (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle className="text-base">{group.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={groupGridClass(group.title)}>
                  {group.slugs.map((slug) => renderField(slug))}
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}
