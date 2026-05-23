import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { listDocumentEntities, listDocumentEntityCategories } from "@/lib/documentApi";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import type {
  DocumentBloque,
  DocumentEntityListItem,
  DocumentEntitySort,
  DocumentEntityType,
} from "@/lib/documentTypes";
import { formatDateShort } from "@/lib/date";
import { FileStack, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const SORT_OPTIONS: { value: DocumentEntitySort; label: string }[] = [
  { value: "created_desc", label: "Más recientes" },
  { value: "created_asc", label: "Más antiguos" },
  { value: "name_asc", label: "Nombre A–Z" },
  { value: "name_desc", label: "Nombre Z–A" },
];

interface DocumentsEntityListProps {
  bloque: DocumentBloque;
  entityType: DocumentEntityType;
  title: string;
  summary?: { entityCount: number; documentCount: number };
  onSelectEntity: (item: DocumentEntityListItem) => void;
}

export function DocumentsEntityList({
  bloque,
  entityType,
  title,
  summary,
  onSelectEntity,
}: DocumentsEntityListProps) {
  const [entities, setEntities] = useState<DocumentEntityListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityQ, setEntityQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [ejercicio, setEjercicio] = useState<string>("all");
  const [sort, setSort] = useState<DocumentEntitySort>("created_desc");
  const [onlyWithDocs, setOnlyWithDocs] = useState(false);
  const [categoriaId, setCategoriaId] = useState("all");
  const [categories, setCategories] = useState<{ id: string; nombre: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const showEjercicio = entityType === "gasto" || entityType === "ingreso";
  const showCategoria = entityType !== "propiedad";
  const currentYear = new Date().getFullYear();
  const ejercicioOptions = useMemo(() => {
    const years = new Set<number>();
    for (let y = currentYear; y >= currentYear - 8; y--) years.add(y);
    for (const e of entities) {
      if (e.ejercicio != null) years.add(e.ejercicio);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [entities, currentYear]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(entityQ.trim()), 300);
    return () => clearTimeout(t);
  }, [entityQ]);

  useEffect(() => {
    setCategoriaId("all");
    if (!showCategoria) {
      setCategories([]);
      return;
    }
    let cancelled = false;
    setLoadingCategories(true);
    listDocumentEntityCategories(bloque, entityType)
      .then((cats) => {
        if (!cancelled) setCategories(cats);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCategories(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bloque, entityType, showCategoria]);

  const categoriaOptions = useMemo(
    () => [
      { value: "all", label: "Todas las categorías" },
      { value: "__none__", label: "Sin categoría" },
      ...categories.map((c) => ({ value: c.id, label: c.nombre })),
    ],
    [categories]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listDocumentEntities({
        bloque,
        entityType,
        q: debouncedQ || undefined,
        ejercicio: showEjercicio && ejercicio !== "all" ? Number(ejercicio) : "all",
        categoriaId: showCategoria && categoriaId !== "all" ? categoriaId : undefined,
        hasDocuments: onlyWithDocs,
        sort,
      });
      setEntities(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar listado");
    } finally {
      setLoading(false);
    }
  }, [
    bloque,
    entityType,
    debouncedQ,
    ejercicio,
    categoriaId,
    onlyWithDocs,
    sort,
    showEjercicio,
    showCategoria,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {summary && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {summary.entityCount} registros
            {summary.documentCount > 0 && (
              <> · {summary.documentCount} documento{summary.documentCount !== 1 ? "s" : ""}</>
            )}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex-1 min-w-[180px] space-y-1">
          <Label className="text-xs text-muted-foreground">Filtrar por nombre</Label>
          <Input
            placeholder="Concepto o nombre…"
            value={entityQ}
            onChange={(e) => setEntityQ(e.target.value)}
          />
        </div>
        {showCategoria && (
          <div className="w-full sm:w-[200px] space-y-1">
            <Label className="text-xs text-muted-foreground">Categoría</Label>
            <CategoryCombobox
              options={categoriaOptions}
              value={categoriaId}
              onValueChange={setCategoriaId}
              disabled={loadingCategories}
              placeholder={loadingCategories ? "Cargando…" : "Todas las categorías"}
              searchPlaceholder="Buscar categoría…"
              emptyText="No hay categorías"
            />
          </div>
        )}
        {showEjercicio && (
          <div className="w-full sm:w-[140px] space-y-1">
            <Label className="text-xs text-muted-foreground">Ejercicio</Label>
            <Select value={ejercicio} onValueChange={setEjercicio}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {ejercicioOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="w-full sm:w-[160px] space-y-1">
          <Label className="text-xs text-muted-foreground">Orden</Label>
          <Select value={sort} onValueChange={(v) => setSort(v as DocumentEntitySort)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Checkbox
            id="only-docs"
            checked={onlyWithDocs}
            onCheckedChange={(c) => setOnlyWithDocs(c === true)}
          />
          <Label htmlFor="only-docs" className="text-sm font-normal cursor-pointer">
            Solo con documentos
          </Label>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Listado
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Categoría</TableHead>
                  {showEjercicio && <TableHead className="w-24">Ejercicio</TableHead>}
                  <TableHead className="w-16 text-center">Docs</TableHead>
                  <TableHead className="hidden sm:table-cell w-28">Alta</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && entities.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={showEjercicio ? 6 : 5}
                      className="text-center text-muted-foreground py-8"
                    >
                      Sin resultados con estos filtros
                    </TableCell>
                  </TableRow>
                ) : (
                  entities.map((row) => (
                    <TableRow key={row.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {row.label}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm truncate max-w-[140px]">
                        {row.categoria_nombre ?? "—"}
                      </TableCell>
                      {showEjercicio && (
                        <TableCell className="tabular-nums text-sm">
                          {row.ejercicio ?? "—"}
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        {row.documentCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs tabular-nums">
                            <FileStack className="h-3.5 w-3.5" />
                            {row.documentCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {formatDateShort(row.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onSelectEntity(row)}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
