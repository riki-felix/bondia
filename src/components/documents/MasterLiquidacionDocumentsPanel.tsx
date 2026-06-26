import { EntityDocumentsPanel, type EntityDocumentsPanelProps } from "./EntityDocumentsPanel";
import { MASTER_LIQUIDACION_FOLDER_SLUG } from "@/lib/documentTypes";

type MasterLiquidacionDocumentsPanelProps = Omit<
  EntityDocumentsPanelProps,
  | "panelTitle"
  | "folderSlug"
  | "excludeFolderSlug"
  | "titleInputId"
  | "titlePlaceholder"
  | "emptyMessage"
  | "uploadSuccessMessage"
  | "singleDocument"
  | "fixedDisplayName"
  | "accept"
>;

export function MasterLiquidacionDocumentsPanel(props: MasterLiquidacionDocumentsPanelProps) {
  return (
    <EntityDocumentsPanel
      {...props}
      panelTitle="Master Liquidación"
      folderSlug={MASTER_LIQUIDACION_FOLDER_SLUG}
      singleDocument
      fixedDisplayName="Master Liquidación"
      accept="application/pdf,.pdf"
      emptyMessage="Sin master de liquidación."
      uploadSuccessMessage="Master de liquidación subido"
    />
  );
}
