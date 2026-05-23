import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Calendar, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateShort } from "@/lib/date";
import { ESTADO_OPTIONS } from "@/lib/propertyTypes";
import { getSupabase } from "@/lib/supabaseReact";
import { PROPERTY_IMAGES_BUCKET } from "@/lib/propertyStorage";

// ─── Types ───────────────────────────────────────────────────

export interface PropertyCard {
  id: string;
  titulo: string | null;
  estado: string | null;
  created_at: string | null;
  ejercicio: number | null;
  liquidacion: boolean;
  foto_destacada_path: string | null;
  /** fecha_transferencia from last liquidación (when liquidacion=true) */
  fecha_transferencia_liq: string | null;
}

interface PropiedadesGridProps {
  initialData: PropertyCard[];
  years: number[];
}

// ─── Helpers ─────────────────────────────────────────────────

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

function estadoLabel(estado: string | null): string {
  return (
    ESTADO_OPTIONS.find((o) => o.value === estado)?.label ?? estado ?? "—"
  );
}

function calcDaysActive(
  createdAt: string | null,
  liquidacion: boolean,
  fechaTransferenciaLiq: string | null
): number | null {
  if (!createdAt) return null;
  const start = new Date(createdAt);
  if (isNaN(start.getTime())) return null;

  let end: Date;
  if (liquidacion && fechaTransferenciaLiq) {
    end = new Date(fechaTransferenciaLiq);
    if (isNaN(end.getTime())) end = new Date();
  } else {
    end = new Date();
  }

  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function imageUrl(path: string): string {
  const supabase = getSupabase();
  const { data } = supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}

// ─── Component ───────────────────────────────────────────────

export default function PropiedadesGrid({
  initialData,
  years,
}: PropiedadesGridProps) {
  const [search, setSearch] = useState("");
  const [ejercicioFilter, setEjercicioFilter] = useState<string>("all");

  const ejercicioOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const minYear = years.length > 0 ? Math.min(...years) : currentYear;
    const opts: { value: string; label: string }[] = [];
    for (let y = currentYear; y >= minYear; y--) {
      opts.push({ value: String(y), label: String(y) });
    }
    return opts;
  }, [years]);

  const filteredData = useMemo(() => {
    let result = initialData;

    if (ejercicioFilter !== "all") {
      const y = Number(ejercicioFilter);
      result = result.filter((p) => {
        if (p.ejercicio != null) return p.ejercicio === y;
        if (p.created_at) {
          const d = new Date(p.created_at);
          return !isNaN(d.getTime()) && d.getFullYear() === y;
        }
        return false;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.titulo?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [initialData, search, ejercicioFilter]);

  return (
    <div className="space-y-6">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar propiedad…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Button asChild size="sm">
          <a href="/propiedades/nuevo">
            <Plus className="h-4 w-4 mr-1" />
            Nueva propiedad
          </a>
        </Button>
        <Select
          value={ejercicioFilter}
          onValueChange={setEjercicioFilter}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Ejercicio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {ejercicioOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Grid ── */}
      {filteredData.length === 0 ? (
        <p className="text-muted-foreground text-sm py-12 text-center">
          No se encontraron propiedades
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredData.map((p) => {
            const days = calcDaysActive(
              p.created_at,
              p.liquidacion,
              p.fecha_transferencia_liq
            );

            return (
              <a
                key={p.id}
                href={`/propiedades/${p.id}`}
                className="group focus:outline-none focus:ring-2 focus:ring-ring rounded-xl"
              >
                <Card className="overflow-hidden transition-shadow group-hover:shadow-lg h-full">
                  {/* Image */}
                  <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                    {p.foto_destacada_path ? (
                      <img
                        src={imageUrl(p.foto_destacada_path)}
                        alt={p.titulo ?? "Propiedad"}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Title */}
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                      {p.titulo ?? "Sin título"}
                    </h3>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={estadoVariant(p.estado)}>
                        {estadoLabel(p.estado)}
                      </Badge>
                      <Badge variant={p.liquidacion ? "success" : "secondary"}>
                        {p.liquidacion ? "Liquidada" : "Activa"}
                      </Badge>
                    </div>

                    {/* Date & days */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateShort(p.created_at)}
                      </span>
                      {days != null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {days} días
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
