import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CreditCard,
  Mail,
  MapPin,
  NotebookPen,
  Package,
  Phone,
  UtensilsCrossed,
} from "lucide-react"
import { Suspense, useMemo } from "react"

import { type ClientStatus, ClientsService } from "@/client"
import { AddNoteForm } from "@/components/Clients/AddNoteForm"
import { AddPackageDialog } from "@/components/Clients/AddPackageDialog"
// Import subcomponents
import { EditClientDialog } from "@/components/Clients/EditClientDialog"
import { PackageCard } from "@/components/Clients/PackageCard"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const statusDotColors: Record<ClientStatus, string> = {
  active: "bg-emerald-500",
  debt: "bg-rose-500",
  paused: "bg-amber-500",
  new: "bg-sky-500",
  completed: "bg-slate-400",
  archived: "bg-zinc-400",
}

const statusAvatarStyles: Record<
  ClientStatus,
  { bg: string; text: string; border: string }
> = {
  active: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/30",
  },
  debt: {
    bg: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/30",
  },
  paused: {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/30",
  },
  new: {
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-500/30",
  },
  completed: {
    bg: "bg-slate-500/10",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-500/30",
  },
  archived: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
}

const statusBadgeStyles: Record<
  ClientStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Активен",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  debt: {
    label: "С долгом",
    className:
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 font-semibold",
  },
  paused: {
    label: "На паузе",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  new: {
    label: "Новый",
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30",
  },
  completed: {
    label: "Завершен",
    className:
      "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30",
  },
  archived: {
    label: "Архив",
    className: "bg-muted text-muted-foreground border-border",
  },
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const currencyFormatter = new Intl.NumberFormat("ru-KG", {
  style: "currency",
  currency: "KGS",
  maximumFractionDigits: 0,
})

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ru-KG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

function getClientQueryOptions(clientId: string) {
  return {
    queryFn: async () =>
      (await ClientsService.readClient({ path: { id: clientId } })).data,
    queryKey: ["clients", "detail", clientId],
  }
}

export const Route = createFileRoute("/_layout/clients/$clientId")({
  component: ClientDetailPage,
  head: () => ({
    meta: [
      {
        title: "Карточка клиента - Meal CRM",
      },
    ],
  }),
})

function ClientDetailPageContent() {
  const { clientId } = Route.useParams()
  const { data: client } = useSuspenseQuery(getClientQueryOptions(clientId))

  const packagesWithDebt = useMemo(
    () => client.packages.filter((pkg) => pkg.debt > 0),
    [client.packages],
  )

  const totalDebt = useMemo(
    () => packagesWithDebt.reduce((sum, pkg) => sum + pkg.debt, 0),
    [packagesWithDebt],
  )

  const activePackagesCount = useMemo(
    () => client.packages.filter((pkg) => pkg.status === "active").length,
    [client.packages],
  )

  const avatarStyle =
    statusAvatarStyles[client.status] ?? statusAvatarStyles.new
  const badgeStyle = statusBadgeStyles[client.status] ?? statusBadgeStyles.new
  const dotColor = statusDotColors[client.status] ?? "bg-slate-400"

  return (
    <div className="flex flex-col gap-6">
      {/* Навигация назад */}
      <div>
        <Link
          to="/clients"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
        >
          <ArrowLeft className="mr-1.5 size-4 transition-transform group-hover:-translate-x-0.5" />
          Назад к списку клиентов
        </Link>
      </div>

      {/* Карточка профиля клиента */}
      <Card className="shadow-xs overflow-hidden border">
        <CardHeader className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Аватар с инициалами и статусной точкой */}
            <div className="relative shrink-0">
              <Avatar
                className={cn(
                  "size-16 border-2 text-base font-bold shadow-xs",
                  avatarStyle.bg,
                  avatarStyle.border,
                )}
              >
                <AvatarFallback
                  className={cn(
                    "bg-transparent font-bold text-lg",
                    avatarStyle.text,
                  )}
                >
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <span
                aria-hidden="true"
                className={cn(
                  "absolute bottom-0 right-0 size-3.5 rounded-full ring-2 ring-background shadow-xs",
                  dotColor,
                )}
              />
            </div>

            {/* Имя и бейджи */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {client.name}
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "px-2.5 py-0.5 text-xs font-medium border shadow-2xs gap-1.5",
                    badgeStyle.className,
                  )}
                >
                  <span
                    className={cn("size-1.5 rounded-full", dotColor)}
                    aria-hidden="true"
                  />
                  {badgeStyle.label}
                </Badge>
                {totalDebt > 0 && (
                  <Badge
                    variant="destructive"
                    className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 font-semibold gap-1 shadow-2xs tabular-nums"
                  >
                    <AlertTriangle className="size-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Долг: {currencyFormatter.format(totalDebt)}</span>
                  </Badge>
                )}
              </div>

              {/* Контакты клиента */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 pt-1 text-sm text-muted-foreground">
                <a
                  href={`tel:${client.phone}`}
                  className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary hover:underline tabular-nums transition-colors"
                >
                  <Phone
                    className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{client.phone}</span>
                </a>
                <span className="hidden sm:inline text-border">•</span>
                <span
                  className="inline-flex items-center gap-1.5"
                  title={client.address || "Адрес не указан"}
                >
                  <MapPin
                    className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{client.address || "Адрес не указан"}</span>
                </span>
                <span className="hidden sm:inline text-border">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail
                    className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                    aria-hidden="true"
                  />
                  {client.email ? (
                    <a
                      href={`mailto:${client.email}`}
                      className="hover:text-primary hover:underline transition-colors"
                    >
                      {client.email}
                    </a>
                  ) : (
                    <span>Email не указан</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <EditClientDialog client={client} />
        </CardHeader>

        {/* Сетка быстрой статистики */}
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 border-t pt-5 bg-muted/20">
          <StatTile
            icon={<Package className="size-4 text-primary" />}
            label="Всего пакетов"
            value={client.packages.length.toString()}
            subvalue={
              activePackagesCount > 0
                ? `${activePackagesCount} активных`
                : "Нет активных"
            }
          />
          <StatTile
            icon={<UtensilsCrossed className="size-4 text-emerald-600" />}
            label="Активных рационов"
            value={activePackagesCount.toString()}
          />
          <StatTile
            icon={<CreditCard className="size-4 text-amber-600" />}
            label="Текущий долг"
            value={currencyFormatter.format(totalDebt)}
            highlightValue={totalDebt > 0}
            subvalue={
              totalDebt > 0 ? "Требуется оплата" : "Задолженность отсутствует"
            }
          />
          <StatTile
            icon={<Calendar className="size-4 text-muted-foreground" />}
            label="Клиент с"
            value={formatDate(client.created_at)}
            subvalue={`Обновлен: ${formatDate(client.updated_at)}`}
          />
        </CardContent>
      </Card>

      {/* Вкладки: Пакеты питания / Заметки менеджера */}
      <Tabs defaultValue="packages" className="gap-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="packages" className="gap-2">
            <span>Пакеты питания</span>
            <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold tabular-nums">
              {client.packages.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <span>Заметки</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
              {client.client_notes.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Вкладка: Пакеты питания */}
        <TabsContent value="packages" className="space-y-4 pt-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Пакеты питания
              </h2>
              <p className="text-muted-foreground text-sm">
                Управление рационами, доставками, заморозками и оплатами.
              </p>
            </div>
            <AddPackageDialog clientId={clientId} />
          </div>

          {client.packages.length > 0 ? (
            <div className="space-y-4">
              {client.packages.map((pkg) => (
                <PackageCard key={pkg.id} package={pkg} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <UtensilsCrossed className="size-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  У клиента пока нет пакетов
                </h3>
                <p className="text-muted-foreground mt-1 text-xs max-w-sm">
                  Добавьте первый пакет питания (3X или 5X), используя кнопку выше, чтобы начать учет
                  доставок и оплат.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Вкладка: Заметки менеджера */}
        <TabsContent value="notes" className="space-y-4 pt-2">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Заметки менеджера
            </h2>
            <p className="text-muted-foreground text-sm">
              Записи звонков, предпочтения и важные детали о клиенте.
            </p>
          </div>

          <AddNoteForm clientId={clientId} />

          <div className="space-y-3">
            {client.client_notes.length > 0 ? (
              client.client_notes.map((note) => (
                <Card key={note.id} className="shadow-2xs">
                  <CardContent className="space-y-2 py-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <NotebookPen className="size-3.5" />
                      <span>{formatDateTime(note.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {note.text}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  Заметок пока нет. Добавьте первую заметку об этом клиенте
                  выше.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ClientDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground p-8 text-center">
          Загрузка карточки клиента…
        </div>
      }
    >
      <ClientDetailPageContent />
    </Suspense>
  )
}

function StatTile({
  icon,
  label,
  value,
  subvalue,
  highlightValue = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subvalue?: string
  highlightValue?: boolean
}) {
  return (
    <div className="bg-card rounded-lg border p-3.5 shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {label}
        </p>
        {icon}
      </div>
      <p
        className={cn(
          "mt-1 text-xl font-bold tracking-tight tabular-nums",
          highlightValue
            ? "text-rose-600 dark:text-rose-400"
            : "text-foreground",
        )}
      >
        {value}
      </p>
      {subvalue ? (
        <p className="text-muted-foreground mt-0.5 text-xs truncate">
          {subvalue}
        </p>
      ) : null}
    </div>
  )
}
