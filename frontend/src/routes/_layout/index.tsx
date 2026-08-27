import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  AlertTriangle,
  ArrowUpRight,
  Clock3,
  PackageCheck,
  Users,
  Utensils,
} from "lucide-react"
import { Suspense, useMemo } from "react"

import { ClientsService, PackagesService } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import useAuth from "@/hooks/useAuth"

const currencyFormatter = new Intl.NumberFormat("ru-KG", {
  style: "currency",
  currency: "KGS",
  maximumFractionDigits: 0,
})

function getClientsQueryOptions() {
  return {
    queryFn: async () =>
      (await ClientsService.readClients({ query: { limit: 500, skip: 0 } }))
        .data,
    queryKey: ["clients", "list", 500],
  }
}

function getActivePackagesQueryOptions() {
  return {
    queryFn: async () =>
      (
        await PackagesService.readPackages({
          query: { status: "active", limit: 500, skip: 0 },
        })
      ).data,
    queryKey: ["packages", "list", "active", "dashboard"],
  }
}

function getTodaysDeliveryCountQueryOptions() {
  return {
    queryFn: async () => (await PackagesService.getTodaysDeliveryCount()).data,
    queryKey: ["deliveries", "today"],
  }
}

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: "Дашборд - Meal CRM",
      },
    ],
  }),
})

function DashboardContent() {
  const { user: currentUser } = useAuth()
  const { data: clientsResponse } = useSuspenseQuery(getClientsQueryOptions())
  const { data: packagesResponse } = useSuspenseQuery(
    getActivePackagesQueryOptions(),
  )
  const { data: todaysDeliveryData } = useSuspenseQuery(
    getTodaysDeliveryCountQueryOptions(),
  )

  const { stats, expiringSoonList, debtClientsList, mealBreakdown } =
    useMemo(() => {
      const clients = clientsResponse.data
      const activePackages = packagesResponse.data
      const now = new Date()
      const nextWeek = new Date(now)
      nextWeek.setDate(now.getDate() + 7)

      const clientMap = new Map(clients.map((c) => [c.id, c]))

      const activeClients = clients.filter(
        (client) => client.status === "active",
      ).length
      const pausedClients = clients.filter(
        (client) => client.status === "paused",
      ).length

      const packagesEndingSoon = activePackages.filter((pkg) => {
        if (!pkg.end_date) {
          return false
        }
        const endDate = new Date(pkg.end_date)
        return endDate >= now && endDate <= nextWeek
      })

      const expiringSoonList = packagesEndingSoon.slice(0, 5).map((pkg) => ({
        packageId: pkg.id,
        clientId: pkg.client_id,
        clientName: clientMap.get(pkg.client_id)?.name || "Клиент",
        mealType: pkg.meal_type,
        endDate: pkg.end_date,
        daysRemaining: pkg.days_remaining,
      }))

      const debtPackages = activePackages.filter((pkg) => pkg.debt > 0)
      const debtClientIds = new Set(
        clients
          .filter((client) => client.status === "debt")
          .map((client) => client.id),
      )
      for (const pkg of debtPackages) {
        debtClientIds.add(pkg.client_id)
      }

      const totalDebt = debtPackages.reduce((sum, pkg) => sum + pkg.debt, 0)

      const debtClientsList = debtPackages.slice(0, 5).map((pkg) => ({
        packageId: pkg.id,
        clientId: pkg.client_id,
        clientName: clientMap.get(pkg.client_id)?.name || "Клиент",
        debtAmount: pkg.debt,
        mealType: pkg.meal_type,
      }))

      const count3X = activePackages.filter((p) => p.meal_type === "3X").length
      const count5X = activePackages.filter((p) => p.meal_type === "5X").length
      const totalActivePackages = activePackages.length || 1

      return {
        stats: {
          activeClients,
          pausedClients,
          packagesEndingSoon: packagesEndingSoon.length,
          debtClients: debtClientIds.size,
          totalDebt,
          todaysDeliveries: todaysDeliveryData.count,
          totalClients: clients.length,
        },
        expiringSoonList,
        debtClientsList,
        mealBreakdown: {
          count3X,
          count5X,
          percent3X: Math.round((count3X / totalActivePackages) * 100),
          percent5X: Math.round((count5X / totalActivePackages) * 100),
          totalDailyMeals: count3X * 3 + count5X * 5,
        },
      }
    }, [clientsResponse.data, packagesResponse.data, todaysDeliveryData])

  const managerName = currentUser?.full_name || currentUser?.email || "Менеджер"

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Приветствие и контекст дня */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Оперативная панель
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Привет, {managerName} 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            Добро пожаловать в панель управления CRM!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="shadow-sm">
            <Link to="/clients">
              <Users className="size-4" />
              База клиентов
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Кокпит */}
      <section
        className="flex flex-col gap-4"
        aria-labelledby="crm-overview-heading"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2
              id="crm-overview-heading"
              className="text-xl font-bold tracking-tight"
            >
              Сводка CRM
            </h2>
            <p className="text-muted-foreground text-sm">
              Актуальные показатели бизнеса по клиентам и доставкам на сегодня.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Hero Card: Доставки на сегодня */}
          <Card className="relative overflow-hidden border-emerald-500/30 bg-emerald-500/5 shadow-sm dark:bg-emerald-950/20 sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Доставки на сегодня
              </CardTitle>
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-xs">
                <PackageCheck className="size-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="text-4xl font-extrabold tracking-tight tabular-nums text-foreground"
                data-testid="todays-deliveries-value"
              >
                {stats.todaysDeliveries}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Рационов питания к выдаче и доставке курьерами сегодня
              </p>
            </CardContent>
          </Card>

          {/* Активные клиенты */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Активные клиенты
              </CardTitle>
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Users className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight tabular-nums">
                  {stats.activeClients}
                </span>
                <span className="text-muted-foreground text-xs">
                  из {stats.totalClients} всего
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Клиенты, питающиеся по активным пакетам
              </p>
            </CardContent>
          </Card>

          {/* Скоро заканчиваются */}
          <Card className="shadow-sm border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/15">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Заканчивающиеся пакеты
              </CardTitle>
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400">
                <Clock3 className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight tabular-nums text-amber-900 dark:text-amber-200">
                  {stats.packagesEndingSoon}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-300"
                >
                  до 7 дней
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Требуют звонка менеджера для продления договора
              </p>
            </CardContent>
          </Card>

          {/* Сумма долгов */}
          <Card className="shadow-sm border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/15">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-300">
                Сумма долгов
              </CardTitle>
              <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight tabular-nums text-rose-700 dark:text-rose-400">
                {currencyFormatter.format(stats.totalDebt)}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {stats.debtClients}{" "}
                {stats.debtClients === 1 ? "клиент" : "клиентов"} с
                задолженностью
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Рабочая зона: Требуют внимания & Структура рационов */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Левая колонка: Требуют внимания (срочные действия менеджера) */}
        <Card className="lg:col-span-7 shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Требуют внимания менеджера
                </CardTitle>
                <CardDescription>
                  Клиенты с истекающими пакетами и неоплаченными счетами
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link
                  to="/clients"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Все клиенты <ArrowUpRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {expiringSoonList.length === 0 && debtClientsList.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                🎉 Отлично! Все пакеты оплачены, и срочных продлений на сегодня
                нет.
              </div>
            ) : (
              <>
                {/* Срочные продления */}
                {expiringSoonList.map((item) => (
                  <div
                    key={`expire-${item.packageId}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Clock3 className="size-4" />
                      </div>
                      <div>
                        <Link
                          to="/clients/$clientId"
                          params={{ clientId: item.clientId }}
                          className="text-sm font-semibold hover:underline"
                        >
                          {item.clientName}
                        </Link>
                        <p className="text-muted-foreground text-xs">
                          Пакет {item.mealType} • Осталось дней:{" "}
                          {item.daysRemaining}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        to="/clients/$clientId"
                        params={{ clientId: item.clientId }}
                      >
                        Продлить
                      </Link>
                    </Button>
                  </div>
                ))}

                {/* Должники */}
                {debtClientsList.map((item) => (
                  <div
                    key={`debt-${item.packageId}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="size-4" />
                      </div>
                      <div>
                        <Link
                          to="/clients/$clientId"
                          params={{ clientId: item.clientId }}
                          className="text-sm font-semibold hover:underline"
                        >
                          {item.clientName}
                        </Link>
                        <p className="text-muted-foreground text-xs">
                          Пакет {item.mealType} • Долг:{" "}
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            {currencyFormatter.format(item.debtAmount)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        to="/clients/$clientId"
                        params={{ clientId: item.clientId }}
                      >
                        Оплата
                      </Link>
                    </Button>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Правая колонка: Аналитика кухни и рационов */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Структура рационов питания
              </CardTitle>
              <CardDescription>
                Соотношение активных пакетов питания
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Прогресс-бар 3X */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Рационы 3X (3 приема пищи)
                  </span>
                  <span className="font-bold tabular-nums">
                    {mealBreakdown.count3X} пак. ({mealBreakdown.percent3X}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${mealBreakdown.percent3X}%` }}
                  />
                </div>
              </div>

              {/* Прогресс-бар 5X */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-blue-500" />
                    Рационы 5X (5 приемов пищи)
                  </span>
                  <span className="font-bold tabular-nums">
                    {mealBreakdown.count5X} пак. ({mealBreakdown.percent5X}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${mealBreakdown.percent5X}%` }}
                  />
                </div>
              </div>

              {/* Суммарная загрузка кухни */}
              <div className="rounded-xl border bg-muted/30 p-3 mt-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Utensils className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Объем производства кухни
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      ~{mealBreakdown.totalDailyMeals} готовых блюд в день
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Быстрые статусы клиентов */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Статусы клиентской базы
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  На паузе / заморозка
                </p>
                <p className="text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400 mt-1">
                  {stats.pausedClients}
                </p>
              </div>
              <div className="rounded-lg border p-3 bg-muted/20">
                <p className="text-xs text-muted-foreground">Всего в базе</p>
                <p className="text-xl font-bold tabular-nums text-foreground mt-1">
                  {stats.totalClients}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground py-12 text-center">
          Загрузка дашборда…
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
