import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { EntityDocumentsPanel } from "./EntityDocumentsPanel";
import { DocumentsEntityList } from "./DocumentsEntityList";
import {
  fetchDocumentsTree,
  getDocumentSignedUrl,
  searchDocuments,
  type DocumentTreeProperty,
} from "@/lib/documentApi";
import type {
  DocumentBloque,
  DocumentEntityListItem,
  DocumentEntitySearchResult,
  DocumentEntityType,
  DocumentSearchResult,
  DocumentTreeSectionSummary,
} from "@/lib/documentTypes";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  ImageIcon,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";

const ENTITY_SECTION_LABEL: Record<DocumentEntityType, string> = {
  propiedad: "Propiedades",
  gasto: "Gastos",
  ingreso: "Ingresos",
  activo: "Activos",
};

const BLOQUE_LABEL: Record<DocumentBloque, string> = {
  engine: "Engine",
  casa: "Casa",
  sanyus: "Sanyus",
};

interface TreeData {
  engine: { propiedades: DocumentTreeProperty[] };
  casa: {
    gastos: DocumentTreeSectionSummary;
    ingresos: DocumentTreeSectionSummary;
    activos: DocumentTreeSectionSummary;
  };
  sanyus: {
    gastos: DocumentTreeSectionSummary;
    ingresos: DocumentTreeSectionSummary;
    activos: DocumentTreeSectionSummary;
  };
}

type View =
  | { kind: "empty" }
  | {
      kind: "property";
      bloque: DocumentBloque;
      entityId: string;
      label: string;
      href: string;
    }
  | {
      kind: "category";
      bloque: DocumentBloque;
      entityType: DocumentEntityType;
      title: string;
      summary: DocumentTreeSectionSummary;
    }
  | {
      kind: "entity";
      bloque: DocumentBloque;
      entityType: DocumentEntityType;
      entityId: string;
      label: string;
      href: string;
      categoryTitle: string;
    };

export default function DocumentsExplorer() {
  const [tree, setTree] = useState<TreeData | null>(null);
  const [loadingTree, setLoadingTree] = useState(true);
  const [view, setView] = useState<View>({ kind: "empty" });
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchEntities, setSearchEntities] = useState<DocumentEntitySearchResult[]>([]);
  const [searchFiles, setSearchFiles] = useState<DocumentSearchResult[]>([]);
  const [openEngine, setOpenEngine] = useState(true);
  const [openCasa, setOpenCasa] = useState(false);
  const [openSanyus, setOpenSanyus] = useState(false);
  const [openPropiedades, setOpenPropiedades] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const loadTree = useCallback(async () => {
    setLoadingTree(true);
    try {
      const data = await fetchDocumentsTree();
      setTree(data.tree);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar árbol");
    } finally {
      setLoadingTree(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) {
      setSearchEntities([]);
      setSearchFiles([]);
      return;
    }
    setSearching(true);
    try {
      const { entities, files } = await searchDocuments({ q });
      setSearchEntities(entities);
      setSearchFiles(files);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error en búsqueda");
    } finally {
      setSearching(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim()) runSearch();
      else {
        setSearchEntities([]);
        setSearchFiles([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const selectProperty = (ent: DocumentTreeProperty) => {
    const key = `engine:propiedad:${ent.id}`;
    setActiveSection(key);
    setView({
      kind: "property",
      bloque: "engine",
      entityId: ent.id,
      label: ent.label,
      href: ent.href,
    });
    setQuery("");
    setSearchEntities([]);
    setSearchFiles([]);
  };

  const selectCategory = (
    bloque: DocumentBloque,
    entityType: DocumentEntityType,
    summary: DocumentTreeSectionSummary
  ) => {
    const key = `${bloque}:${entityType}`;
    setActiveSection(key);
    setView({
      kind: "category",
      bloque,
      entityType,
      title: `${BLOQUE_LABEL[bloque]} · ${ENTITY_SECTION_LABEL[entityType]}`,
      summary,
    });
    setQuery("");
    setSearchEntities([]);
    setSearchFiles([]);
  };

  const openEntityFromSearch = (ent: DocumentEntitySearchResult) => {
    setQuery("");
    setSearchEntities([]);
    setSearchFiles([]);
    if (ent.entity_type === "propiedad") {
      setView({
        kind: "property",
        bloque: "engine",
        entityId: ent.id,
        label: ent.label,
        href: ent.href,
      });
      setActiveSection(`engine:propiedad:${ent.id}`);
      return;
    }
    setView({
      kind: "entity",
      bloque: ent.bloque,
      entityType: ent.entity_type,
      entityId: ent.id,
      label: ent.label,
      href: ent.href,
      categoryTitle: `${BLOQUE_LABEL[ent.bloque]} · ${ENTITY_SECTION_LABEL[ent.entity_type]}`,
    });
    setActiveSection(`${ent.bloque}:${ent.entity_type}`);
  };

  const selectEntityFromList = (item: DocumentEntityListItem) => {
    if (view.kind !== "category") return;
    setView({
      kind: "entity",
      bloque: view.bloque,
      entityType: view.entityType,
      entityId: item.id,
      label: item.label,
      href: item.href,
      categoryTitle: view.title,
    });
  };

  const backToCategory = () => {
    if (view.kind !== "entity") return;
    const summary =
      tree &&
      (view.bloque === "casa"
        ? view.entityType === "gasto"
          ? tree.casa.gastos
          : view.entityType === "ingreso"
            ? tree.casa.ingresos
            : tree.casa.activos
        : view.entityType === "gasto"
          ? tree.sanyus.gastos
          : view.entityType === "ingreso"
            ? tree.sanyus.ingresos
            : tree.sanyus.activos);
    if (!summary) return;
    setView({
      kind: "category",
      bloque: view.bloque,
      entityType: view.entityType,
      title: view.categoryTitle,
      summary,
    });
  };

  const openDoc = async (doc: DocumentSearchResult) => {
    try {
      const { url } = await getDocumentSignedUrl(doc.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo abrir");
    }
  };

  const renderSectionButton = (
    bloque: DocumentBloque,
    entityType: DocumentEntityType,
    summary: DocumentTreeSectionSummary
  ) => {
    const key = `${bloque}:${entityType}`;
    const label = ENTITY_SECTION_LABEL[entityType];
    return (
      <button
        type="button"
        key={key}
        className={`flex w-full items-center gap-1.5 rounded px-3 py-1.5 text-left text-sm hover:bg-accent ${
          activeSection === key ? "bg-accent font-medium" : ""
        }`}
        onClick={() => selectCategory(bloque, entityType, summary)}
      >
        <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {summary.documentCount > 0 ? summary.documentCount : summary.entityCount}
        </span>
      </button>
    );
  };

  const renderPropertyList = (propiedades: DocumentTreeProperty[]) => (
    <ul className="ml-4 space-y-0.5 border-l pl-2">
      {propiedades.map((ent) => (
        <li key={ent.id}>
          <button
            type="button"
            className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm hover:bg-accent ${
              view.kind === "property" && view.entityId === ent.id
                ? "bg-accent font-medium"
                : ""
            }`}
            onClick={() => selectProperty(ent)}
          >
            <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate flex-1">{ent.label}</span>
            {ent.documentCount > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {ent.documentCount}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );

  const showDocumentSearch = query.trim().length > 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[60vh]">
      <Card className="lg:w-72 shrink-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Carpetas</CardTitle>
        </CardHeader>
        <CardContent className="text-sm max-h-[70vh] overflow-y-auto space-y-1">
          {loadingTree ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando…
            </div>
          ) : !tree ? (
            <p className="text-muted-foreground">Sin datos</p>
          ) : (
            <>
              <Collapsible open={openEngine} onOpenChange={setOpenEngine}>
                <CollapsibleTrigger className="flex w-full items-center gap-1 font-medium py-1 hover:text-foreground text-muted-foreground">
                  {openEngine ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Engine
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Collapsible open={openPropiedades} onOpenChange={setOpenPropiedades}>
                    <CollapsibleTrigger className="flex w-full items-center gap-1 py-1 pl-3 text-muted-foreground hover:text-foreground">
                      {openPropiedades ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                      Propiedades
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {renderPropertyList(tree.engine.propiedades)}
                    </CollapsibleContent>
                  </Collapsible>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openCasa} onOpenChange={setOpenCasa}>
                <CollapsibleTrigger className="flex w-full items-center gap-1 font-medium py-1 hover:text-foreground text-muted-foreground">
                  {openCasa ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Casa
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-2 space-y-0.5">
                  {renderSectionButton("casa", "gasto", tree.casa.gastos)}
                  {renderSectionButton("casa", "ingreso", tree.casa.ingresos)}
                  {renderSectionButton("casa", "activo", tree.casa.activos)}
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openSanyus} onOpenChange={setOpenSanyus}>
                <CollapsibleTrigger className="flex w-full items-center gap-1 font-medium py-1 hover:text-foreground text-muted-foreground">
                  {openSanyus ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Sanyus
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-2 space-y-0.5">
                  {renderSectionButton("sanyus", "gasto", tree.sanyus.gastos)}
                  {renderSectionButton("sanyus", "ingreso", tree.sanyus.ingresos)}
                  {renderSectionButton("sanyus", "activo", tree.sanyus.activos)}
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex-1 space-y-4 min-w-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar propiedades, gastos, activos o archivos…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {showDocumentSearch ? (
          <div className="space-y-4">
            {searching && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando…
              </div>
            )}
            {!searching &&
              searchEntities.length === 0 &&
              searchFiles.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin resultados</p>
              )}
            {searchEntities.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Entidades ({searchEntities.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {searchEntities.map((ent) => (
                      <li key={`${ent.bloque}:${ent.entity_type}:${ent.id}`}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm text-left hover:bg-accent"
                          onClick={() => openEntityFromSearch(ent)}
                        >
                          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium truncate block">{ent.label}</span>
                            <span className="text-xs text-muted-foreground truncate block">
                              {ent.breadcrumb}
                            </span>
                          </div>
                          {ent.documentCount > 0 && (
                            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                              {ent.documentCount} doc.
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {searchFiles.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Archivos ({searchFiles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {searchFiles.map((doc) => (
                      <li key={doc.id} className="flex items-start gap-2 border rounded-md p-3 text-sm">
                        {doc.mime_type === "application/pdf" ? (
                          <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                        ) : (
                          <ImageIcon className="h-4 w-4 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            className="font-medium hover:underline text-left truncate block w-full"
                            onClick={() => openDoc(doc)}
                          >
                            {doc.display_name}
                          </button>
                          <p className="text-xs text-muted-foreground truncate">{doc.breadcrumb}</p>
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={() =>
                              openEntityFromSearch({
                                id: doc.entity_id,
                                label: doc.entity_label,
                                href: doc.entity_href,
                                bloque: doc.bloque,
                                entity_type: doc.entity_type,
                                breadcrumb: doc.breadcrumb,
                                documentCount: 0,
                              })
                            }
                          >
                            Ir a entidad
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        ) : view.kind === "category" ? (
          <DocumentsEntityList
            bloque={view.bloque}
            entityType={view.entityType}
            title={view.title}
            summary={view.summary}
            onSelectEntity={selectEntityFromList}
          />
        ) : view.kind === "entity" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={backToCategory}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                {view.categoryTitle}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold truncate">{view.label}</h2>
              <Button variant="outline" size="sm" asChild>
                <a href={view.href}>Abrir en la app</a>
              </Button>
            </div>
            <EntityDocumentsPanel
              bloque={view.bloque}
              entityType={view.entityType}
              entityId={view.entityId}
            />
          </div>
        ) : view.kind === "property" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold truncate">{view.label}</h2>
              <Button variant="outline" size="sm" asChild>
                <a href={view.href}>Abrir propiedad</a>
              </Button>
            </div>
            <EntityDocumentsPanel
              bloque="engine"
              entityType="propiedad"
              entityId={view.entityId}
            />
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              Selecciona una carpeta en el árbol o busca por nombre de entidad o archivo.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
