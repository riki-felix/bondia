import { useCallback, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { BondiaLogo } from "@/components/BondiaLogo";
import type { BrandingState } from "@/lib/branding";
import { LOGO_FILE_ACCEPT } from "@/lib/branding";
import { removeBrandingLogo, uploadBrandingLogo } from "@/lib/brandingApi";

interface BrandingSectionProps {
  initialBranding: BrandingState;
}

function validateLogoFile(file: File): string | null {
  const allowed = ["image/jpeg", "image/png", "image/svg+xml"];
  if (!allowed.includes(file.type)) {
    return "Formato no permitido. Usa JPG, PNG o SVG.";
  }
  if (file.size > 2 * 1024 * 1024) {
    return "El archivo no puede superar 2 MB.";
  }
  return null;
}

export default function BrandingSection({ initialBranding }: BrandingSectionProps) {
  const [branding, setBranding] = useState<BrandingState>(initialBranding);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateLogoFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);
    try {
      const next = await uploadBrandingLogo(file);
      setBranding(next);
      toast.success("Logo actualizado");
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir el logo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, []);

  const handleRemove = useCallback(async () => {
    setRemoving(true);
    try {
      await removeBrandingLogo();
      setBranding({ logoUrl: null, mimeType: null, updatedAt: null });
      toast.success("Logo eliminado");
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al quitar el logo");
    } finally {
      setRemoving(false);
    }
  }, []);

  const busy = uploading || removing;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Marca</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Logo en la cabecera. Si no hay imagen, se muestra el texto{" "}
          <span className="font-semibold text-foreground">Bondia</span> con la
          tipografía de la interfaz.
        </p>

        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Vista previa
          </p>
          <div className="flex min-h-[3rem] items-center rounded-md bg-sidebar-primary px-4 py-3">
            <BondiaLogo logoUrl={branding.logoUrl} variant="header" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div>
            <Label
              htmlFor="branding-logo-upload"
              className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary hover:underline"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {branding.logoUrl ? "Cambiar logo" : "Subir logo"}
            </Label>
            <input
              ref={inputRef}
              id="branding-logo-upload"
              type="file"
              accept={LOGO_FILE_ACCEPT}
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </div>

          {branding.logoUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void handleRemove()}
            >
              {removing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Quitar imagen
            </Button>
          )}
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5 shrink-0" />
          JPG, PNG o SVG · máx. 2 MB
        </p>
      </CardContent>
    </Card>
  );
}
