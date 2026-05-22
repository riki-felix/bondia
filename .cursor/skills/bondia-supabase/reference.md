# Esquema resumido Bondia

```
propiedades 1──* liquidaciones

casa_gastos *──1 casa_gastos_categorias
casa_gastos 1──* casa_gastos_overrides

sanyus_* (espejo de casa_*)

activos_tags *──* casa_activos_v2 (casa_activos_tags)
activos_tags *──* sanyus_activos_v2 (sanyus_activos_tags)

activos_caracteristicas 1──* *_activos_caracteristica_valores

cartera_movimientos (origen/destino: inversiones|familiar|sanyus|ahorro)
cartera_ajustes (bolsillo ahorro)

metodos_pago ← casa_gastos, sanyus_gastos (metodo_pago_id)
```

No hay FK a `auth.users` en el esquema de aplicación.
