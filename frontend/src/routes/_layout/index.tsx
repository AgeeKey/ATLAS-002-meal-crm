import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { AlertCircle, Clock3, Package2, Users } from "lucide-react"
import { type ReactNode, Suspense, useMemo } from "react"

import { ClientsService, PackagesService } from "@/client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import useAuth from "@/hooks/useAuth"

const currencyFormatter = new Intl.NumberFormat("en-US", {
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
    queryFn: async () =>
      (await PackagesService.getTodaysDeliveryCount()).data,
    queryKey: ["deliveries", "today"],
  }
}

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: "Dashboard - Meal CRM",
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

  const stats = useMemo(() => {
    const clients = clientsResponse.data
    const activePackages = packagesResponse.data
    const now = new Date()
    const nextWeek = new Date(now)
    nextWeek.setDate(now.getDate() + 7)

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
    }).length

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

    return {
      activeClients,
      pausedClients,
      packagesEndingSoon,
      debtClients: debtClientIds.size,
      totalDebt,
      todaysDeliveries: todaysDeliveryData.count,
    }
  }, [clientsResponse.data, packagesResponse.data, todaysDeliveryData])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Hi, {currentUser?.full_name || currentUser?.email} 👋
        </h1>
        <p className="text-muted-foreground">
          Welcome back, nice to see you again!
        </p>
      </div>

      <section
        className="flex flex-col gap-4"
        aria-labelledby="crm-overview-heading"
      >
        <div>
          <h2 id="crm-overview-heading" className="text-xl font-semibold">
            CRM Overview
          </h2>
          <p className="text-muted-foreground text-sm">
            Live business metrics derived from clients and active packages.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Active clients"
            value={stats.activeClients.toString()}
            description="Clients currently being served"
            icon={<Users className="size-4" />}
          />
          <StatCard
            title="Paused clients"
            value={stats.pausedClients.toString()}
            description="Clients temporarily on hold"
            icon={<Clock3 className="size-4" />}
          />
          <StatCard
            title="Packages ending soon"
            value={stats.packagesEndingSoon.toString()}
            description="Active packages ending within 7 days"
            icon={<Package2 className="size-4" />}
          />
          <StatCard
            title="Debt clients"
            value={stats.debtClients.toString()}
            description="Clients flagged with debt or unpaid packages"
            icon={<AlertCircle className="size-4" />}
          />
          <StatCard
            title="Total debt"
            value={currencyFormatter.format(stats.totalDebt)}
            description="Outstanding amount across active packages"
            icon={<AlertCircle className="size-4" />}
          />
          <StatCard
            title="Today's deliveries"
            value={stats.todaysDeliveries.toString()}
            description="Meal packages scheduled for delivery today"
            icon={<Package2 className="size-4" />}
          />
        </div>
      </section>
    </div>
  )
}

function Dashboard() {
  return (
    <Suspense
      fallback={<div className="text-muted-foreground">Loading dashboard…</div>}
    >
      <DashboardContent />
    </Suspense>
  )
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string
  value: string
  description: string
  icon: ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  )
}
