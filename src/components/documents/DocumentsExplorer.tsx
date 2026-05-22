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
import { fetchDocumentsTree, getDocumentSignedUrl, searchDocuments } from "@/lib/documentApi";
import type { DocumentBloque, DocumentEntityType, DocumentSearchResult } from "@/lib/documentTypes";
import { ChevronDown, ChevronRight, FileText, Folder, ImageIcon, Loader2, Search } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface TreeEntity {
  id: string;
  label: string;
  href: string;
  documentCount: number;
}

interface TreeData {
  engine: { propiedades: TreeEntity[] };
  casa: {
    gastos: TreeEntity[];
    ingresos: TreeEntity[];
    activos: TreeEntity[];
  };
  sanyus: {
    gastos: TreeEntity[];
    ingresos: TreeEntity[];
    activos: TreeEntity[];
  };
}

interface Selection {
  bloque: DocumentBloque;
  entityType: DocumentEntityType;
  entityId: string;
  label: string;
  href: string;
}

export default function DocumentsExplorer() {
  const [tree, setTree] = useState<TreeData | null>(null);
  const [loadingTree, setLoadingTree] = useState(true);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DocumentSearchResult[]>([]);
  const [openEngine, setOpenEngine] = useState(true);
  const [openCasa, setOpenCasa] = useState(false);
  const [openSanyus, setOpenSanyus] = useState(false);
  const [openPropiedades, setOpenPropiedades] = useState(true);

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
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchDocuments({ q });
      setSearchResults(results);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error en búsqueda");
    } finally {
      setSearching(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim()) runSearch();
      else setSearchResults([]);
    }, 300);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const selectEntity = (
    bloque: DocumentBloque,
    entityType: DocumentEntityType,
    ent: TreeEntity
  ) => {
    setSelection({
      bloque,
      entityType,
      entityId: ent.id,
      label: ent.label,
      href: ent.href,
    });
    setQuery("");
    setSearchResults([]);
  };

  const openDoc = async (doc: DocumentSearchResult) => {
    try {
      const { url, mime_type } = await getDocumentSignedUrl(doc.id);
      if (mime_type === "application/pdf") {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo abrir");
    }
  };

  const renderEntityList = (
    bloque: DocumentBloque,
    entityType: DocumentEntityType,
    entities: TreeEntity[]
  ) => (
    <ul className="ml-4 space-y-0.5 border-l pl-2">
      {entities.map((ent) => (
        <li key={ent.id}>
          <button
            type="button"
            className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm hover:bg-accent ${
              selection?.entityId === ent.id ? "bg-accent font-medium" : ""
            }`}
            onClick={() => selectEntity(bloque, entityType, ent)}
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
                      {openPropiedades ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      Propiedades
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {renderEntityList("engine", "propiedad", tree.engine.propiedades)}
                    </CollapsibleContent>
                  </Collapsible>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openCasa} onOpenChange={setOpenCasa}>
                <CollapsibleTrigger className="flex w-full items-center gap-1 font-medium py-1 hover:text-foreground text-muted-foreground">
                  {openCasa ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Casa
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-2 space-y-1">
                  <p className="text-xs text-muted-foreground pl-3 pt-1">Gastos</p>
                  {renderEntityList("casa", "gasto", tree.casa.gastos)}
                  <p className="text-xs text-muted-foreground pl-3">Ingresos</p>
                  {renderEntityList("casa", "ingreso", tree.casa.ingresos)}
                  <p className="text-xs text-muted-foreground pl-3">Activos</p>
                  {renderEntityList("casa", "activo", tree.casa.activos)}
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openSanyus} onOpenChange={setOpenSanyus}>
                <CollapsibleTrigger className="flex w-full items-center gap-1 font-medium py-1 hover:text-foreground text-muted-foreground">
                  {openSanyus ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Sanyus
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-2 space-y-1">
                  <p className="text-xs text-muted-foreground pl-3 pt-1">Gastos</p>
                  {renderEntityList("sanyus", "gasto", tree.sanyus.gastos)}
                  <p className="text-xs text-muted-foreground pl-3">Ingresos</p>
                  {renderEntityList("sanyus", "ingreso", tree.sanyus.ingresos)}
                  <p className="text-xs text-muted-foreground pl-3">Activos</p>
                  {renderEntityList("sanyus", "activo", tree.sanyus.activos)}
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
            placeholder="Buscar por nombre de archivo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {query.trim() ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Resultados
                {searching && <Loader2 className="inline h-4 w-4 ml-2 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {searchResults.length === 0 && !searching ? (
                <p className="text-sm text-muted-foreground">Sin resultados</p>
              ) : (
                <ul className="space-y-2">
                  {searchResults.map((doc) => (
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
                        <a
                          href={doc.entity_href}
                          className="text-xs text-primary hover:underline"
                        >
                          Ir a entidad
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : selection ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold truncate">{selection.label}</h2>
              <Button variant="outline" size="sm" asChild>
                <a href={selection.href}>Abrir entidad</a>
              </Button>
            </div>
            <EntityDocumentsPanel
              bloque={selection.bloque}
              entityType={selection.entityType}
              entityId={selection.entityId}
            />
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              Selecciona una carpeta en el árbol o busca un documento por nombre.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
