-- Métodos de pago globales (transversal a Casa y Sanyus)

CREATE TABLE IF NOT EXISTS public.metodos_pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('tarjeta','efectivo','transferencia','paypal')),
    alcance TEXT NOT NULL CHECK (alcance IN ('casa','sanyus','ambos')),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.metodos_pago ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for metodos_pago" ON public.metodos_pago FOR ALL USING (true) WITH CHECK (true);

-- FK en gastos de cada bloque
ALTER TABLE public.casa_gastos
  ADD COLUMN IF NOT EXISTS metodo_pago_id UUID REFERENCES public.metodos_pago(id) ON DELETE SET NULL;

ALTER TABLE public.sanyus_gastos
  ADD COLUMN IF NOT EXISTS metodo_pago_id UUID REFERENCES public.metodos_pago(id) ON DELETE SET NULL;
