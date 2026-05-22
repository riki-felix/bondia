import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import {
  deleteDocument,
  getDocumentSignedUrl,
  listDocuments,
  reorderDocuments,
  uploadDocument,
} from "@/lib/documentApi";
import type { DocumentBloque, DocumentEntityType, Documento } from "@/lib/documentTypes";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  FileText,
  ImageIcon,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";

interface EntityDocumentsPanelProps {
  bloque: DocumentBloque;
  entityType: DocumentEntityType;
  entityId: string | null;
  title?: string;
  disabledMessage?: string;
  compact?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EntityDocumentsPanel({
  bloque,
  entityType,
  entityId,
  title = "Documentos",
  disabledMessage = "Guarda la entidad para poder adjuntar documentos.",
  compact = false,
}: EntityDocumentsPanelProps) {
  const [documents, setDocuments] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!entityId) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    try {
      const docs = await listDocuments(bloque, entityType, entityId);
      setDocuments(docs);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar documentos");
    } finally {
      setLoading(false);
    }
  }, [bloque, entityType, entityId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !entityId) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadDocument(bloque, entityType, entityId, file);
      }
      toast.success(files.length > 1 ? "Documentos subidos" : "Documento subido");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= documents.length) return;
    const a = documents[index];
    const b = documents[next];
    const items = [
      { id: a.id, sort_order: b.sort_order },
      { id: b.id, sort_order: a.sort_order },
    ];
    try {
      await reorderDocuments(items);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al reordenar");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDocument(deleteId);
      toast.success("Documento eliminado");
      setDeleteId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const openPreview = async (doc: Documento) => {
    try {
      const { url, mime_type } = await getDocumentSignedUrl(doc.id);
      if (mime_type === "application/pdf") {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      setPreviewMime(mime_type);
      setPreviewUrl(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo abrir");
    }
  };

  const content = (
    <>
      {!entityId ? (
        <p className="text-sm text-muted-foreground">{disabledMessage}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
              multiple
              className="sr-only"
              disabled={uploading}
              onChange={handleUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Subir PDF o JPG
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando…
            </div>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin documentos adjuntos.</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc, index) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  {doc.mime_type === "application/pdf" ? (
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <button
                    type="button"
                    className="flex-1 text-left truncate hover:underline"
                    onClick={() => openPreview(doc)}
                  >
                    {doc.display_name}
                  </button>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatSize(doc.size_bytes)}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      title="Subir en la lista"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === documents.length - 1}
                      onClick={() => move(index, 1)}
                      title="Bajar en la lista"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openPreview(doc)}
                      title="Abrir"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setDeleteId(doc.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {previewUrl && previewMime?.startsWith("image/") && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => {
            setPreviewUrl(null);
            setPreviewMime(null);
          }}
        >
          <img
            src={previewUrl}
            alt="Vista previa"
            className="max-h-[90vh] max-w-full rounded-md object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrará el archivo de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (compact) {
    return <div className="space-y-2">{content}</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
