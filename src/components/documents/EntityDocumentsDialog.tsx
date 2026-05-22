import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntityDocumentsPanel } from "./EntityDocumentsPanel";
import type { DocumentBloque, DocumentEntityType } from "@/lib/documentTypes";

interface EntityDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bloque: DocumentBloque;
  entityType: DocumentEntityType;
  entityId: string;
  entityLabel: string;
}

export function EntityDocumentsDialog({
  open,
  onOpenChange,
  bloque,
  entityType,
  entityId,
  entityLabel,
}: EntityDocumentsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Documentos — {entityLabel}</DialogTitle>
        </DialogHeader>
        <EntityDocumentsPanel
          bloque={bloque}
          entityType={entityType}
          entityId={entityId}
          compact
        />
      </DialogContent>
    </Dialog>
  );
}
