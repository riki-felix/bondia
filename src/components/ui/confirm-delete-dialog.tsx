import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmWord: string;
  onConfirm: () => Promise<void>;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmWord,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  const matches = typed.trim().toLowerCase() === confirmWord.toLowerCase();

  const handleConfirm = async () => {
    if (!matches) return;
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
      setTyped("");
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setTyped("");
        onOpenChange(v);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <p className="text-sm">
            Escribe <strong className="text-destructive">{confirmWord}</strong>{" "}
            para confirmar:
          </p>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={confirmWord}
            autoFocus
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={!matches || deleting}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Eliminando…
              </>
            ) : (
              "Eliminar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
