import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import {
  base64ToImageFile,
  catastroFachadaPreviewUrl,
  importCatastroFachada,
  isCatastroReferenciaValidada,
  parcelReferenciaFromRef,
  validateCatastroReferencia,
  type CatastroValidationResult,
} from "@/lib/catastroApi";
import { cn } from "@/lib/utils";
import { CheckCircle2, ImageIcon, Loader2 } from "lucide-react";

export interface CatastroFachadaImportPayload {
  file: File;
  previewUrl: string;
}

interface CatastroReferenciaFieldProps {
  id?: string;
  value: string;
  validatedReferencia?: string | null;
  validatedAt?: string | null;
  onChange: (value: string) => void;
  onValidated?: (result: CatastroValidationResult) => void;
  /** Si hay propiedad guardada, sube la fachada directamente a Supabase. */
  propertyId?: string;
  /** Tras importar fachada sin propertyId (creación) o como alternativa al upload directo. */
  onFachadaImported?: (payload: CatastroFachadaImportPayload) => void;
  /** Tras subir fachada a propiedad existente. */
  onFachadaUploaded?: (publicUrl: string) => void;
  /** Si true, no muestra toast tras onFachadaImported (p. ej. subida inmediata en el padre). */
  skipFachadaImportedToast?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function CatastroReferenciaField({
  id = "numero_catastro",
  value,
  validatedReferencia,
  validatedAt,
  onChange,
  onValidated,
  propertyId,
  onFachadaImported,
  onFachadaUploaded,
  skipFachadaImportedToast = false,
  label = "Ref. Catastral",
  placeholder = "Referencia",
  className,
}: CatastroReferenciaFieldProps) {
  const [loading, setLoading] = useState(false);
  const [importingFachada, setImportingFachada] = useState(false);
  const [fachadaAvailable, setFachadaAvailable] = useState<boolean | null>(null);

  const isValidated = isCatastroReferenciaValidada(value, validatedReferencia, validatedAt);

  const fachadaRef = useMemo(() => {
    const source = isValidated ? validatedReferencia || value : value;
    return parcelReferenciaFromRef(source);
  }, [isValidated, validatedReferencia, value]);

  const fachadaPreviewUrl = useMemo(
    () => (fachadaRef ? catastroFachadaPreviewUrl(fachadaRef) : null),
    [fachadaRef]
  );

  useEffect(() => {
    setFachadaAvailable(null);
  }, [fachadaPreviewUrl, isValidated]);

  async function handleValidate() {
    const ref = value.trim();
    if (!ref) {
      toast.error("Introduce una referencia catastral");
      return;
    }

    setLoading(true);
    setFachadaAvailable(null);
    try {
      const result = await validateCatastroReferencia(ref);
      onValidated?.(result);

      const parts = [`${result.superficieConstruidaM2} m² construidos`];
      if (result.superficieViviendaM2 != null) {
        parts.push(`${result.superficieViviendaM2} m² vivienda`);
      }
      if (result.anioConstruccion) parts.push(`año ${result.anioConstruccion}`);
      if (result.uso) parts.push(result.uso);
      toast.success(`Catastro validado: ${parts.join(" · ")}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo validar la referencia";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleUseFachada() {
    if (!fachadaRef) return;

    setImportingFachada(true);
    try {
      if (propertyId) {
        const result = await importCatastroFachada(fachadaRef, propertyId);
        if (!result.publicUrl) throw new Error("No se pudo guardar la foto");
        onFachadaUploaded?.(result.publicUrl);
        toast.success("Foto de fachada importada del Catastro");
        return;
      }

      const result = await importCatastroFachada(fachadaRef);
      if (!result.base64) throw new Error("No se pudo obtener la foto");

      const file = base64ToImageFile(result.base64, result.mimeType || "image/jpeg");
      const previewUrl = URL.createObjectURL(file);
      onFachadaImported?.({ file, previewUrl });
      if (!skipFachadaImportedToast) {
        toast.success("Foto de fachada lista para guardar");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo importar la fachada";
      toast.error(msg);
    } finally {
      setImportingFachada(false);
    }
  }

  const showFachadaBlock = isValidated && fachadaPreviewUrl && fachadaAvailable === true;

  return (
    <div className={cn("w-full min-w-0 space-y-2 sm:col-span-2 lg:col-span-4", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex w-full gap-2">
        <div className="relative min-w-0 flex-1">
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn("min-w-0 w-full", isValidated && "pr-9")}
          />
          {isValidated && (
            <CheckCircle2
              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600"
              aria-hidden
            />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleValidate}
          disabled={loading || !value.trim()}
          className="shrink-0 gap-1.5 whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Validando…</span>
            </>
          ) : isValidated ? (
            "Revalidar"
          ) : (
            <>
              <span className="sm:hidden">Validar</span>
              <span className="hidden sm:inline">Validar catastro</span>
            </>
          )}
        </Button>
      </div>

      {isValidated && fachadaPreviewUrl && fachadaAvailable !== false && (
        <div
          className={cn(
            "overflow-hidden rounded-md border bg-muted/30",
            fachadaAvailable === null && "min-h-[4.5rem]"
          )}
        >
          <img
            src={fachadaPreviewUrl}
            alt="Foto de fachada del Catastro"
            className={cn(
              "max-h-36 w-full object-cover",
              fachadaAvailable !== true && "hidden"
            )}
            onLoad={() => setFachadaAvailable(true)}
            onError={() => setFachadaAvailable(false)}
          />
          {fachadaAvailable === null && (
            <div className="flex items-center justify-center gap-2 px-3 py-6 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando foto de fachada…
            </div>
          )}
        </div>
      )}

      {showFachadaBlock && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            Fuente: Dirección General del Catastro
          </p>
          {(onFachadaImported || onFachadaUploaded || propertyId) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={importingFachada}
              onClick={handleUseFachada}
            >
              {importingFachada ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
              Usar como foto destacada
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function touchCatastroReferencia<
  T extends {
    numero_catastro: string;
    catastro_referencia_validada: string;
    catastro_validado_at: string;
  },
>(prev: T, value: string): T {
  const stillValid = isCatastroReferenciaValidada(
    value,
    prev.catastro_referencia_validada,
    prev.catastro_validado_at
  );

  return {
    ...prev,
    numero_catastro: value,
    ...(stillValid ? {} : { catastro_referencia_validada: "", catastro_validado_at: "" }),
  };
}

export function applyCatastroToFormFields<
  T extends {
    superficie_m2: string;
    superficie_registrada_m2: string;
    anio_construccion: string;
    numero_catastro: string;
    catastro_referencia_validada: string;
    catastro_validado_at: string;
  },
>(prev: T, result: CatastroValidationResult): T {
  return {
    ...prev,
    numero_catastro: result.referenciaCatastral,
    catastro_referencia_validada: result.referenciaCatastral,
    catastro_validado_at: new Date().toISOString(),
    superficie_m2: prev.superficie_m2.trim()
      ? prev.superficie_m2
      : String(result.superficieConstruidaM2),
    superficie_registrada_m2:
      prev.superficie_registrada_m2.trim() || result.superficieViviendaM2 == null
        ? prev.superficie_registrada_m2
        : String(result.superficieViviendaM2),
    anio_construccion:
      prev.anio_construccion.trim() && prev.anio_construccion !== "0"
        ? prev.anio_construccion
        : result.anioConstruccion != null
          ? String(result.anioConstruccion)
          : prev.anio_construccion,
  };
}
