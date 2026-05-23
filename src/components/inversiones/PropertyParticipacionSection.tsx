import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_PARTICIPACION_BIENES_SANYUS_CB,
  DEFAULT_PARTICIPACION_JASP,
  DEFAULT_PARTICIPACION_SANYUS,
  formatParticipacionPct,
  participacionCastello,
  participacionExterna,
  parseParticipacionInput,
} from "@/lib/participacion";

export interface PropertyParticipacionFormValues {
  participacion_sanyus: string;
  participacion_jasp: string;
  participacion_bienes_sanyus_cb: string;
}

interface PropertyParticipacionSectionProps {
  values: PropertyParticipacionFormValues;
  onChange: (field: keyof PropertyParticipacionFormValues, value: string) => void;
  disabled?: boolean;
}

export function PropertyParticipacionSection({
  values,
  onChange,
  disabled = false,
}: PropertyParticipacionSectionProps) {
  const sanyus =
    parseParticipacionInput(values.participacion_sanyus) ??
    DEFAULT_PARTICIPACION_SANYUS;
  const jasp =
    parseParticipacionInput(values.participacion_jasp) ??
    DEFAULT_PARTICIPACION_JASP;
  const externa = participacionExterna(sanyus, jasp);

  const bienesParsed =
    parseParticipacionInput(values.participacion_bienes_sanyus_cb) ??
    DEFAULT_PARTICIPACION_BIENES_SANYUS_CB;
  const castello = participacionCastello(bienesParsed);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Base de Reparto
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="participacion_externa">Externa</Label>
            <Input
              id="participacion_externa"
              value={formatParticipacionPct(externa)}
              readOnly
              disabled
              className="bg-muted tabular-nums"
              title="Calculado: 100% − Sanyus − JASP"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="participacion_sanyus">Sanyus</Label>
            <Input
              id="participacion_sanyus"
              type="text"
              inputMode="decimal"
              value={values.participacion_sanyus}
              onChange={(e) =>
                onChange("participacion_sanyus", e.target.value)
              }
              placeholder={`${DEFAULT_PARTICIPACION_SANYUS}%`}
              disabled={disabled}
              className="tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="participacion_jasp">JASP</Label>
            <Input
              id="participacion_jasp"
              type="text"
              inputMode="decimal"
              value={values.participacion_jasp}
              onChange={(e) => onChange("participacion_jasp", e.target.value)}
              placeholder={`${DEFAULT_PARTICIPACION_JASP}%`}
              disabled={disabled}
              className="tabular-nums"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="participacion_castello">CASTELLO</Label>
          <Input
            id="participacion_castello"
            value={formatParticipacionPct(castello)}
            readOnly
            disabled
            className="bg-muted tabular-nums"
            title="Calculado: 100% − Bienes Sanyus CB"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="participacion_bienes_sanyus_cb">Bienes Sanyus CB</Label>
          <Input
            id="participacion_bienes_sanyus_cb"
            type="text"
            inputMode="decimal"
            value={values.participacion_bienes_sanyus_cb}
            onChange={(e) =>
              onChange("participacion_bienes_sanyus_cb", e.target.value)
            }
            placeholder={`${DEFAULT_PARTICIPACION_BIENES_SANYUS_CB}%`}
            disabled={disabled}
            className="tabular-nums"
          />
        </div>
      </div>
    </div>
  );
}
