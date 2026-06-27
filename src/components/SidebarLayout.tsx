import { useEffect, useState, type ReactNode } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { EyeOff, Eye, Settings, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { BondiaLogo } from "./BondiaLogo"
import { AppSidebar, type FavoritoItem } from "./AppSidebar"

const HEADER_BTN =
  "h-8 w-8 text-sidebar-primary-foreground hover:bg-white/10 hover:text-sidebar-primary-foreground"

/** Shopify-like shell: header oscuro + paneles claros con esquinas superiores redondeadas */
const SHELL_CANVAS = "bg-sidebar-primary"
const SHELL_BODY = "flex min-h-0 flex-1 gap-0 px-2 pb-2"
const MAIN_PANEL =
  "min-h-0 flex-1 overflow-hidden rounded-tr-lg bg-background"

interface SidebarLayoutProps {
  currentPath: string
  currentSearch?: string
  favoritos?: FavoritoItem[]
  children: ReactNode
}

export function SidebarLayout({
  currentPath,
  currentSearch = "",
  favoritos = [],
  children,
}: SidebarLayoutProps) {
  const [incognito, setIncognito] = useState(false)

  useEffect(() => {
    try {
      setIncognito(sessionStorage.getItem("incognito") === "1")
    } catch {
      // Ignore storage access issues.
    }
  }, [])

  const toggleIncognito = () => {
    setIncognito((v) => {
      const next = !v
      sessionStorage.setItem("incognito", next ? "1" : "0")
      return next
    })
  }

  return (
    <SidebarProvider className={cn("flex h-svh min-h-0 flex-col", SHELL_CANVAS)}>
      <header className="flex h-12 shrink-0 items-center gap-3 px-3 text-sidebar-primary-foreground">
        <SidebarTrigger className={cn(HEADER_BTN, "md:hidden")} />
        <a
          href="/"
          className="flex items-center hover:opacity-90 transition-opacity"
        >
          <BondiaLogo className="h-8 w-auto" />
        </a>
        <div className="ml-auto flex items-center gap-1">
          <span
            className="hidden sm:inline text-[10px] text-sidebar-primary-foreground/50 font-mono select-all mr-1"
            title="Versión"
          >
            v{__APP_VERSION__}
          </span>
          <a href="/diario" title="Diario">
            <Button
              variant="ghost"
              size="icon"
              className={cn(HEADER_BTN, currentPath === "/diario" && "bg-white/15")}
            >
              <BookOpen className="h-4 w-4" />
            </Button>
          </a>
          <a href="/ajustes" title="Ajustes">
            <Button
              variant="ghost"
              size="icon"
              className={cn(HEADER_BTN, currentPath === "/ajustes" && "bg-white/15")}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </a>
          <Button
            variant="ghost"
            size="icon"
            className={cn(HEADER_BTN, incognito && "bg-white/15")}
            onClick={toggleIncognito}
            title={incognito ? "Mostrar valores" : "Ocultar valores"}
          >
            {incognito ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <SidebarTrigger className={cn(HEADER_BTN, "hidden md:inline-flex")} />
        </div>
      </header>

      <div className={SHELL_BODY}>
        <AppSidebar
          currentPath={currentPath}
          currentSearch={currentSearch}
          favoritos={favoritos}
        />
        <SidebarInset data-incognito={incognito || undefined} className={MAIN_PANEL}>
          <div className="min-h-0 flex-1 overflow-auto p-6">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
