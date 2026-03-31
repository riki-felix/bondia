import { Building2, Home, LayoutDashboard, Package, Receipt, Tag, TrendingDown, TrendingUp } from "lucide-react"
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

const navItems = [
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

interface AppSidebarProps {
  currentPath: string
}

export function AppSidebar({ currentPath }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <a href="/" className="flex items-center gap-2 px-2 py-1">
          <span className="font-semibold text-lg tracking-tight">Bondia</span>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
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
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Casa</SidebarGroupLabel>
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
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
