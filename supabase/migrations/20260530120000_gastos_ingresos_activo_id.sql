-- Relación opcional gasto/ingreso → activo (Casa y Sanyus)

ALTER TABLE public.casa_gastos
  ADD COLUMN IF NOT EXISTS activo_id UUID REFERENCES public.casa_activos_v2(id) ON DELETE SET NULL;

ALTER TABLE public.casa_ingresos
  ADD COLUMN IF NOT EXISTS activo_id UUID REFERENCES public.casa_activos_v2(id) ON DELETE SET NULL;

ALTER TABLE public.sanyus_gastos
  ADD COLUMN IF NOT EXISTS activo_id UUID REFERENCES public.sanyus_activos_v2(id) ON DELETE SET NULL;

ALTER TABLE public.sanyus_ingresos
  ADD COLUMN IF NOT EXISTS activo_id UUID REFERENCES public.sanyus_activos_v2(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_casa_gastos_activo ON public.casa_gastos(activo_id);
CREATE INDEX IF NOT EXISTS idx_casa_ingresos_activo ON public.casa_ingresos(activo_id);
CREATE INDEX IF NOT EXISTS idx_sanyus_gastos_activo ON public.sanyus_gastos(activo_id);
CREATE INDEX IF NOT EXISTS idx_sanyus_ingresos_activo ON public.sanyus_ingresos(activo_id);

COMMENT ON COLUMN public.casa_gastos.activo_id IS 'Activo Casa vinculado (opcional)';
COMMENT ON COLUMN public.casa_ingresos.activo_id IS 'Activo Casa vinculado (opcional)';
