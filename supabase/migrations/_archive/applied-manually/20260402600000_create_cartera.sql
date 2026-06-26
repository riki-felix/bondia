-- Cartera: movimientos entre carteras + ajuste de ahorro

-- ─── Movimientos ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cartera_movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origen TEXT NOT NULL CHECK (origen IN ('inversiones','familiar','sanyus','ahorro')),
    destino TEXT NOT NULL CHECK (destino IN ('inversiones','familiar','sanyus','ahorro')),
    concepto TEXT NOT NULL,
    importe NUMERIC NOT NULL CHECK (importe > 0),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    ejercicio INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT cartera_mov_origen_destino_diff CHECK (origen <> destino)
);

ALTER TABLE public.cartera_movimientos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cartera_movimientos' AND policyname = 'Allow all for cartera_movimientos') THEN
    CREATE POLICY "Allow all for cartera_movimientos"
      ON public.cartera_movimientos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── Ajustes (saldo manual de Ahorro) ───────────────────────

CREATE TABLE IF NOT EXISTS public.cartera_ajustes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cartera TEXT NOT NULL UNIQUE CHECK (cartera IN ('ahorro')),
    importe NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cartera_ajustes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cartera_ajustes' AND policyname = 'Allow all for cartera_ajustes') THEN
    CREATE POLICY "Allow all for cartera_ajustes"
      ON public.cartera_ajustes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Seed ahorro row
INSERT INTO public.cartera_ajustes (cartera, importe)
VALUES ('ahorro', 0)
ON CONFLICT (cartera) DO NOTHING;
