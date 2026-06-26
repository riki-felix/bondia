import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  updateDocumentDisplayName,
  uploadDocument,
} from "@/lib/documentApi";
import type {
  DocumentBloque,
  DocumentEntityType,
  Documento,
  PendingTitledDocument,
} from "@/lib/documentTypes";
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

export interface EntityDocumentsPanelProps {
  bloque: DocumentBloque;
  entityType: DocumentEntityType;
  entityId: string | null;
  /** Título del bloque (card) */
  panelTitle?: string;
  disabledMessage?: string;
  compact?: boolean;
  /** Solo listar/subir en esta carpeta */
  folderSlug?: string;
  /** Excluir documentos de otra carpeta al listar */
  excludeFolderSlug?: string;
  titleInputId?: string;
  titlePlaceholder?: string;
  emptyMessage?: string;
  uploadSuccessMessage?: string;
  /** Solo un documento en la carpeta (reemplaza al subir) */
  singleDocument?: boolean;
  fixedDisplayName?: string;
  accept?: string;
  pendingDocuments?: PendingTitledDocument[];
  onPendingDocumentsAdd?: (items: PendingTitledDocument[]) => void;
  onPendingDocumentRemove?: (index: number) => void;
  onPendingDocumentTitleChange?: (index: number, title: string) => void;
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
  panelTitle = "Documentos",
  disabledMessage = "Guarda la entidad para poder adjuntar documentos.",
  compact = false,
  folderSlug,
  excludeFolderSlug,
  titleInputId = "document-title",
  titlePlaceholder = "Ej. Factura de compra",
  emptyMessage = "Sin documentos adjuntos.",
  uploadSuccessMessage = "Documento subido",
  singleDocument = false,
  fixedDisplayName = "Master Liquidación",
  accept,
  pendingDocuments = [],
  onPendingDocumentsAdd,
  onPendingDocumentRemove,
  onPendingDocumentTitleChange,
}: EntityDocumentsPanelProps) {
  const [documents, setDocuments] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({});
  const [savingTitleId, setSavingTitleId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!entityId) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    try {
      const docs = await listDocuments(bloque, entityType, entityId, {
        folderSlug,
        excludeFolderSlug,
      });
      setDocuments(docs);
      setTitleDrafts(
        Object.fromEntries(docs.map((doc) => [doc.id, doc.display_name]))
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar documentos");
    } finally {
      setLoading(false);
    }
  }, [bloque, entityType, entityId, folderSlug, excludeFolderSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const trimmedTitle = singleDocument ? fixedDisplayName : newTitle.trim();
    if (!trimmedTitle) {
      toast.error("Indica un título antes de subir el documento");
      e.target.value = "";
      return;
    }

    const file = files[0];

    if (singleDocument && accept) {
      const allowed = accept.split(",").map((s) => s.trim().toLowerCase());
      const fileType = (file.type || "").toLowerCase();
      const fileName = file.name.toLowerCase();
      const matches =
        allowed.some((a) => a.startsWith(".") && fileName.endsWith(a)) ||
        allowed.some(
          (a) =>
            !a.startsWith(".") &&
            (fileType === a ||
              (!fileType && a === "application/pdf" && fileName.endsWith(".pdf")))
        );
      if (!matches) {
        toast.error("Solo se permiten archivos PDF");
        e.target.value = "";
        return;
      }
    }

    if (!entityId && onPendingDocumentsAdd) {
      onPendingDocumentsAdd([{ file, title: trimmedTitle }]);
      setNewTitle("");
      e.target.value = "";
      return;
    }

    if (!entityId) return;
    setUploading(true);
    try {
      await uploadDocument(bloque, entityType, entityId, file, {
        displayName: trimmedTitle,
        folderSlug,
      });
      toast.success(uploadSuccessMessage);
      setNewTitle("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const saveTitle = async (doc: Documento) => {
    const draft = (titleDrafts[doc.id] ?? "").trim();
    if (!draft) {
      toast.error("El título no puede estar vacío");
      setTitleDrafts((prev) => ({ ...prev, [doc.id]: doc.display_name }));
      return;
    }
    if (draft === doc.display_name) return;

    setSavingTitleId(doc.id);
    try {
      await updateDocumentDisplayName(doc.id, draft);
      toast.success("Título actualizado");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar título");
      setTitleDrafts((prev) => ({ ...prev, [doc.id]: doc.display_name }));
    } finally {
      setSavingTitleId(null);
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

  const canUploadPending = !entityId && !!onPendingDocumentsAdd;
  const canUpload =
    !uploading && (singleDocument || !!newTitle.trim());
  const uploadLabel =
    singleDocument && (documents.length > 0 || pendingDocuments.length > 0)
      ? "Reemplazar master"
      : singleDocument
        ? "Subir PDF"
        : "Subir documento";

  const content = (
    <>
      {!entityId && !canUploadPending ? (
        <p className="text-sm text-muted-foreground">{disabledMessage}</p>
      ) : (
        <>
          <div className="space-y-3 mb-3">
            {!singleDocument && (
              <div className="space-y-1.5">
                <Label htmlFor={titleInputId}>Título del documento</Label>
                <Input
                  id={titleInputId}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={titlePlaceholder}
                  disabled={uploading}
                />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                accept={accept}
                disabled={!canUpload}
                onChange={handleUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canUpload}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploadLabel}
              </Button>
              {canUploadPending && (
                <span className="text-xs text-muted-foreground">
                  Se guardarán al crear la entidad
                </span>
              )}
            </div>
          </div>

          {canUploadPending && pendingDocuments.length > 0 && (
            <ul className="space-y-2 mb-3">
              {pendingDocuments.map((item, index) => (
                <li
                  key={`${item.file.name}-${index}`}
                  className="flex flex-col gap-2 rounded-md border border-dashed px-3 py-2 text-sm sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {item.file.type === "application/pdf" ? (
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    {singleDocument ? (
                      <span className="font-medium truncate">{item.title}</span>
                    ) : (
                      <Input
                        value={item.title}
                        onChange={(e) =>
                          onPendingDocumentTitleChange?.(index, e.target.value)
                        }
                        className="h-8"
                        placeholder="Título"
                      />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground truncate sm:max-w-[120px]">
                    {item.file.name}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatSize(item.file.size)}
                  </span>
                  {onPendingDocumentRemove && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive shrink-0 self-end sm:self-auto"
                      onClick={() => onPendingDocumentRemove(index)}
                      title="Quitar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {entityId && loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando…
            </div>
          ) : entityId && documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          ) : entityId && documents.length > 0 ? (
            <ul className="space-y-2">
              {documents.map((doc, index) => (
                <li
                  key={doc.id}
                  className="flex flex-col gap-2 rounded-md border px-3 py-2 text-sm sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {doc.mime_type === "application/pdf" ? (
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    {singleDocument ? (
                      <span className="font-medium truncate">{doc.display_name}</span>
                    ) : (
                      <Input
                        value={titleDrafts[doc.id] ?? doc.display_name}
                        onChange={(e) =>
                          setTitleDrafts((prev) => ({
                            ...prev,
                            [doc.id]: e.target.value,
                          }))
                        }
                        onBlur={() => saveTitle(doc)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          }
                        }}
                        className="h-8"
                        disabled={savingTitleId === doc.id}
                      />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatSize(doc.size_bytes)}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0 self-end sm:self-auto">
                    {!singleDocument && (
                      <>
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
                      </>
                    )}
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
          ) : canUploadPending && pendingDocuments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          ) : null}
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
        <CardTitle className="text-base">{panelTitle}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
