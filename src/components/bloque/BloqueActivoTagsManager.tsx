// src/components/bloque/BloqueActivoTagsManager.tsx
import { useState, useCallback } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditableCell } from "../inversiones/EditableCell";
import { toast } from "@/components/ui/sonner";
import type { ActivoTag } from "@/lib/bloqueTypes";
import type { BloqueConfig } from "@/lib/bloqueConfig";
import { Plus, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

const TAG_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
];

interface Props {
  config: BloqueConfig;
  initialTags: ActivoTag[];
}

export default function BloqueActivoTagsManager({ config, initialTags }: Props) {
  const createActivoTag = config.endpoints.createActivoTag;
  const updateActivoTag = config.endpoints.updateActivoTag;
  const deleteActivoTag = config.endpoints.deleteActivoTag;
  if (!createActivoTag || !updateActivoTag || !deleteActivoTag) return null;

  const [tags, setTags] = useState<ActivoTag[]>(initialTags);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const addTag = useCallback(async () => {
    try {
      const res = await fetch(createActivoTag, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: "Nuevo tag" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTags((prev) => [...prev, data]);
      toast.success("Tag creado");
    } catch (e: any) {
      toast.error(e.message || "Error al crear");
    }
  }, [config]);

  const updateName = useCallback(async (id: string, nombre: unknown) => {
    const newName = String(nombre ?? "").trim();
    if (!newName) return;

    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, nombre: newName } : t)));

    try {
      const res = await fetch(updateActivoTag, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nombre: newName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTags((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    }
  }, [config]);

  const updateColor = useCallback(async (id: string, color: string) => {
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, color } : t)));

    try {
      const res = await fetch(updateActivoTag, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, color }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (e: any) {
      toast.error(e.message || "Error al guardar color");
    }
  }, [config]);

  const deleteTag = useCallback(async (id: string) => {
    try {
      const res = await fetch(deleteActivoTag, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setTags((prev) => prev.filter((t) => t.id !== id));
      toast.success("Tag eliminado");
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar");
    }
  }, [config]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={addTag}>
          <Plus className="h-4 w-4 mr-1" /> Añadir tag
        </Button>
        <span className="text-sm text-muted-foreground">
          {tags.length} {tags.length === 1 ? "tag" : "tags"}
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-[120px]">Color</TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Sin tags. Pulsa «Añadir tag» para empezar.
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="p-1">
                    <EditableCell
                      value={tag.nombre}
                      type="text"
                      onSave={(v) => updateName(tag.id, v)}
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <div className="flex items-center gap-1">
                      {TAG_COLORS.map((c) => (
                        <button
                          key={c}
                          className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                          style={{
                            backgroundColor: c,
                            borderColor: tag.color === c ? "white" : "transparent",
                            boxShadow: tag.color === c ? `0 0 0 2px ${c}` : "none",
                          }}
                          onClick={() => updateColor(tag.id, c)}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget({ id: tag.id, name: tag.nombre })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar tag"
        description={`¿Eliminar "${deleteTarget?.name}"? Se desasignará de todos los activos.`}
        confirmWord={deleteTarget?.name || ""}
        onConfirm={async () => {
          if (deleteTarget) await deleteTag(deleteTarget.id);
        }}
      />
    </div>
  );
}
