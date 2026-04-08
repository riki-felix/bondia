import { useState, type ReactNode } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { EyeOff, Eye, Settings } from "lucide-react"
import { AppSidebar, type FavoritoItem } from "./AppSidebar"

interface SidebarLayoutProps {
  currentPath: string
  favoritos?: FavoritoItem[]
  children: ReactNode
}

export function SidebarLayout({ currentPath, favoritos = [], children }: SidebarLayoutProps) {
  const [incognito, setIncognito] = useState(() =>
    typeof window !== "undefined" && sessionStorage.getItem("incognito") === "1"
  )

  const toggleIncognito = () => {
    setIncognito((v) => {
      const next = !v
      sessionStorage.setItem("incognito", next ? "1" : "0")
      return next
    })
  }

  return (
    <SidebarProvider>
      <AppSidebar currentPath={currentPath} favoritos={favoritos} />
      <SidebarInset data-incognito={incognito || undefined}>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 !h-4" />
          <span className="text-[10px] text-muted-foreground/50 font-mono select-all" title="Versión">
            v{__APP_VERSION__}
          </span>
          <span className="font-semibold text-lg tracking-tight md:hidden">Bondia</span>
          <div className="ml-auto flex items-center gap-1">
            <a href="/ajustes" title="Ajustes">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </a>
            <Button
              variant={incognito ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={toggleIncognito}
              title={incognito ? "Mostrar valores" : "Ocultar valores"}
            >
              {incognito ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
