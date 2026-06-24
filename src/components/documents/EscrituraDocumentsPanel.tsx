import { EntityDocumentsPanel, type EntityDocumentsPanelProps } from "./EntityDocumentsPanel";
import { ESCRITURA_FOLDER_SLUG } from "@/lib/documentTypes";

type EscrituraDocumentsPanelProps = Omit<
  EntityDocumentsPanelProps,
  | "panelTitle"
  | "folderSlug"
  | "excludeFolderSlug"
  | "titleInputId"
  | "titlePlaceholder"
  | "emptyMessage"
  | "uploadSuccessMessage"
>;

export function EscrituraDocumentsPanel(props: EscrituraDocumentsPanelProps) {
  return (
    <EntityDocumentsPanel
      {...props}
      panelTitle="Escritura"
      folderSlug={ESCRITURA_FOLDER_SLUG}
      titleInputId="escritura-title"
      titlePlaceholder="Ej. Escritura de compraventa"
      emptyMessage="Sin documentos de escritura."
      uploadSuccessMessage="Documento de escritura subido"
    />
  );
}
