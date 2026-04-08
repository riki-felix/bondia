import { useState, useCallback } from "react"
import { Building2, ChevronDown, Home, LayoutDashboard, Package, Receipt, Star, Tag, TrendingDown, TrendingUp, Wallet } from "lucide-react"
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

const navItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Cartera", href: "/cartera", icon: Wallet },
  { title: "Inversiones", href: "/inversiones", icon: Building2 },
  { title: "Liquidaciones", href: "/liquidaciones", icon: Receipt },
  { title: "Propiedades", href: "/propiedades", icon: Home },
]

const casaItems = [
  { title: "Control", href: "/casa/control", icon: LayoutDashboard },
  { title: "Gastos", href: "/casa/gastos", icon: TrendingDown },
  { title: "Ingresos", href: "/casa/ingresos", icon: TrendingUp },
  { title: "Activos", href: "/casa/activos", icon: Package },
  { title: "Categorías", href: "/casa/categorias", icon: Tag },
]

const sanyusItems = [
  { title: "Control", href: "/sanyus/control", icon: LayoutDashboard },
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
  favoritos?: FavoritoItem[]
}

const STORAGE_KEY = "sidebar-open-groups"

function getGroupForPath(path: string): string | null {
  if (path.startsWith("/casa")) return "casa"
  if (path.startsWith("/sanyus")) return "sanyus"
  return "engine"
}

function getInitialOpen(currentPath: string): Record<string, boolean> {
  // Start with the group matching the current route (SSR-safe, no flash)
  const active = getGroupForPath(currentPath)
  const defaults: Record<string, boolean> = {}
  if (active) defaults[active] = true

  // Merge with sessionStorage (client-only) so manually-opened groups persist
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, boolean>
        for (const [k, v] of Object.entries(saved)) {
          defaults[k] = v
        }
        // Ensure the active group is always open
        if (active) defaults[active] = true
      }
    } catch {}
  }
  return defaults
}

export function AppSidebar({ currentPath, favoritos = [] }: AppSidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => getInitialOpen(currentPath))

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
                          isActive={currentPath + (typeof window !== "undefined" ? window.location.search : "") === fav.href}
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
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
