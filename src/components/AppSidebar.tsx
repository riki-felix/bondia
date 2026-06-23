import { useState, useCallback, useEffect } from "react"
import { Building2, ChevronDown, FileStack, FileText, Home, LayoutDashboard, Package, Receipt, Star, Tag, TrendingDown, TrendingUp, Wallet, type LucideIcon } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  CASA_ACTIVO_TITULARES,
  casaActivoTitularViewTitle,
  type CasaActivoTitular,
} from "@/lib/casaActivoTitular"

type CasaNavItem = {
  title: string
  href: string
  icon: LucideIcon
  titularFilter?: CasaActivoTitular
}

const casaActivosItems: CasaNavItem[] = CASA_ACTIVO_TITULARES.map((titular) => ({
  title: casaActivoTitularViewTitle(titular),
  href: `/casa/activos?titular=${titular}`,
  icon: Package,
  titularFilter: titular,
}))

const casaItems: CasaNavItem[] = [
  { title: "Control", href: "/casa/control", icon: LayoutDashboard },
  { title: "Gastos", href: "/casa/gastos", icon: TrendingDown },
  { title: "Ingresos", href: "/casa/ingresos", icon: TrendingUp },
  ...casaActivosItems,
  { title: "Categorías", href: "/casa/categorias", icon: Tag },
]

const navItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Cartera", href: "/cartera", icon: Wallet },
  { title: "Inversiones", href: "/inversiones", icon: Building2 },
  { title: "Liquidaciones", href: "/liquidaciones", icon: Receipt },
  { title: "Propiedades", href: "/propiedades", icon: Home },
]

const documentosItems = [
  { title: "Explorador", href: "/documentos", icon: FileStack },
]

const sanyusItems = [
  { title: "Control", href: "/sanyus/control", icon: LayoutDashboard },
  { title: "Modelo 184", href: "/sanyus/modelo-184", icon: FileText },
  { title: "Gastos", href: "/sanyus/gastos", icon: TrendingDown },
  { title: "Ingresos", href: "/sanyus/ingresos", icon: TrendingUp },
  { title: "Activos", href: "/sanyus/activos", icon: Package },
  { title: "Categorías", href: "/sanyus/categorias", icon: Tag },
]

export interface FavoritoItem {
  nombre: string
  href: string
}

interface AppSidebarProps {
  currentPath: string
  currentSearch?: string
  favoritos?: FavoritoItem[]
}

function isCasaNavItemActive(
  item: CasaNavItem,
  currentPath: string,
  currentSearch: string
): boolean {
  if (item.titularFilter) {
    if (!currentPath.startsWith("/casa/activos")) return false
    const params = new URLSearchParams(currentSearch)
    return params.get("titular") === item.titularFilter
  }
  return currentPath.startsWith(item.href)
}

const STORAGE_KEY = "sidebar-open-groups"

function getGroupForPath(path: string): string | null {
  if (path.startsWith("/documentos")) return "documentos"
  if (path.startsWith("/casa")) return "casa"
  if (path.startsWith("/sanyus")) return "sanyus"
  return "engine"
}

function getInitialOpen(currentPath: string): Record<string, boolean> {
  // Start with the group matching the current route (SSR-safe, no flash)
  const active = getGroupForPath(currentPath)
  const defaults: Record<string, boolean> = {}
  if (active) defaults[active] = true
  return defaults
}

export function AppSidebar({ currentPath, currentSearch = "", favoritos = [] }: AppSidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => getInitialOpen(currentPath))

  useEffect(() => {
    const active = getGroupForPath(currentPath)
    setOpenGroups((prev) => {
      const next = { ...prev }
      if (active) next[active] = true
      return next
    })
  }, [currentPath])

  useEffect(() => {
    const active = getGroupForPath(currentPath)
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as Record<string, boolean>
      setOpenGroups((prev) => {
        const next = { ...prev, ...saved }
        if (active) next[active] = true
        return next
      })
    } catch {
      // Ignore malformed persisted state.
    }
  }, [currentPath])

  const toggle = useCallback((group: string, open: boolean) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [group]: open }
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <a href="/" className="flex items-center gap-2 px-2 py-1">
          <span className="font-semibold text-lg tracking-tight">Bondia</span>
        </a>
      </SidebarHeader>
      <SidebarContent>
        {favoritos.length > 0 && (
          <Collapsible open={openGroups.favoritos !== false} onOpenChange={(o) => toggle("favoritos", o)} className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger>
                  Favoritos
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {favoritos.map((fav) => (
                      <SidebarMenuItem key={fav.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={currentPath === fav.href}
                          tooltip={fav.nombre}
                        >
                          <a href={fav.href}>
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span>{fav.nombre}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
        <Collapsible open={!!openGroups.engine} onOpenChange={(o) => toggle("engine", o)} className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                Engine
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.href === "/" ? currentPath === "/" : currentPath.startsWith(item.href)}
                        tooltip={item.title}
                      >
                        <a href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
        <Collapsible open={!!openGroups.casa} onOpenChange={(o) => toggle("casa", o)} className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                Casa
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {casaItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isCasaNavItemActive(item, currentPath, currentSearch)}
                        tooltip={item.title}
                      >
                        <a href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
        <Collapsible open={!!openGroups.sanyus} onOpenChange={(o) => toggle("sanyus", o)} className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                Sanyus
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sanyusItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={currentPath.startsWith(item.href)}
                        tooltip={item.title}
                      >
                        <a href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
        <Collapsible open={!!openGroups.documentos} onOpenChange={(o) => toggle("documentos", o)} className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                Documentos
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {documentosItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={currentPath.startsWith(item.href)}
                        tooltip={item.title}
                      >
                        <a href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
