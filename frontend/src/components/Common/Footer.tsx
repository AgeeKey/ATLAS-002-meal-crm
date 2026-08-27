export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t py-4 px-6 bg-background/50 backdrop-blur-xs">
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">Atlas Meal CRM</span>
          <span>•</span>
          <span>Система управления доставкой рационов питания</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
            </span>
            <span>Сервер активен</span>
          </span>
          <span>•</span>
          <span>© {currentYear} Atlas</span>
        </div>
      </div>
    </footer>
  )
}
