import { useState, useCallback, useEffect } from "react"
import {
  Building2,
  ChevronDown,
  FileStack,
  FileText,
  Home,
  LayoutDashboard,
  Package,
  Receipt,
  Star,
  Tag,
  TrendingDown,
  TrendingUp,
  Wallet,
  BarChart3,
  type LucideIcon,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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

type NavItem = {
  title: string
  href: string
  icon: LucideIcon
}

type CasaNavItem = NavItem & {
  titularFilter?: CasaActivoTitular
}

const topLevelItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Cartera", href: "/cartera", icon: Wallet },
]

const engineItems: NavItem[] = [
  { title: "Informes", href: "/informes", icon: BarChart3 },
  { title: "Inversiones", href: "/inversiones", icon: Building2 },
  { title: "Liquidaciones", href: "/liquidaciones", icon: Receipt },
  { title: "Propiedades", href: "/propiedades", icon: Home },
]

const documentosItems: NavItem[] = [
  { title: "Explorador", href: "/documentos", icon: FileStack },
]

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

const sanyusItems: NavItem[] = [
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

function isTopLevelItemActive(href: string, currentPath: string): boolean {
  if (href === "/") return currentPath === "/"
  return currentPath === href || currentPath.startsWith(`${href}/`)
}

function isNavItemActive(item: NavItem, currentPath: string): boolean {
  if (item.href === "/") return currentPath === "/"
  return currentPath.startsWith(item.href)
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
  if (path === "/" || path.startsWith("/cartera")) return null
  if (path.startsWith("/documentos")) return "documentos"
  if (path.startsWith("/casa")) return "casa"
  if (path.startsWith("/sanyus")) return "sanyus"
  if (
    path.startsWith("/informes") ||
    path.startsWith("/inversiones") ||
    path.startsWith("/liquidaciones") ||
    path.startsWith("/propiedades")
  ) {
    return "engine"
  }
  return null
}

function getInitialOpen(currentPath: string): Record<string, boolean> {
  const active = getGroupForPath(currentPath)
  const defaults: Record<string, boolean> = {}
  if (active) defaults[active] = true
  return defaults
}

const sectionGroupClass =
  "px-1.5 py-0.5 rounded-md transition-colors group-data-[state=open]/collapsible:bg-sidebar-accent/60"

const sectionTriggerClass =
  "w-full h-7 uppercase tracking-wide hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"

function NavSection({
  label,
  open,
  onOpenChange,
  children,
}: {
  label: string
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="group/collapsible"
    >
      <SidebarGroup className={sectionGroupClass}>
        <SidebarGroupLabel asChild className="h-7 px-1.5">
          <CollapsibleTrigger className={sectionTriggerClass}>
            {label}
            <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>{children}</CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

export function AppSidebar({
  currentPath,
  currentSearch = "",
  favoritos = [],
}: AppSidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    getInitialOpen(currentPath)
  )

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
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  return (
    <Sidebar
      collapsible="icon"
      className="!inset-y-auto !top-12 !bottom-auto !left-2 !h-[calc(100svh-3.5rem)] border-0 [&_[data-sidebar=sidebar]]:overflow-hidden [&_[data-sidebar=sidebar]]:rounded-tl-lg [&_[data-sidebar=sidebar]]:bg-sidebar"
    >
      <SidebarContent className="gap-0 px-1 pt-1">
        <SidebarGroup className="px-1.5 py-0.5">
          <SidebarMenu className="gap-0">
            {topLevelItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  isActive={isTopLevelItemActive(item.href, currentPath)}
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
        </SidebarGroup>

        {favoritos.length > 0 && (
          <NavSection
            label="Favoritos"
            open={openGroups.favoritos !== false}
            onOpenChange={(o) => toggle("favoritos", o)}
          >
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">
                {favoritos.map((fav) => (
                  <SidebarMenuItem key={fav.href}>
                    <SidebarMenuButton
                      asChild
                      size="sm"
                      isActive={currentPath === fav.href}
                      tooltip={fav.nombre}
                    >
                      <a href={fav.href}>
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        <span>{fav.nombre}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </NavSection>
        )}

        <NavSection
          label="Engine"
          open={!!openGroups.engine}
          onOpenChange={(o) => toggle("engine", o)}
        >
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              {engineItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    size="sm"
                    isActive={isNavItemActive(item, currentPath)}
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
        </NavSection>

        <NavSection
          label="Casa"
          open={!!openGroups.casa}
          onOpenChange={(o) => toggle("casa", o)}
        >
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              {casaItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    size="sm"
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
        </NavSection>

        <NavSection
          label="Sanyus"
          open={!!openGroups.sanyus}
          onOpenChange={(o) => toggle("sanyus", o)}
        >
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              {sanyusItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    size="sm"
                    isActive={isNavItemActive(item, currentPath)}
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
        </NavSection>

        <NavSection
          label="Documentos"
          open={!!openGroups.documentos}
          onOpenChange={(o) => toggle("documentos", o)}
        >
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              {documentosItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    size="sm"
                    isActive={isNavItemActive(item, currentPath)}
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
        </NavSection>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
