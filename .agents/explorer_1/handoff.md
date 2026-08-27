# Handoff Report: Requirement R1 (Client List Redesign) Investigation

## 1. Observation

### 1.1 Target Files and Scope
- Target page: `frontend/src/routes/_layout/clients.tsx` (467 lines)
- Client types: `frontend/src/client/types.gen.ts` (lines 952–993: `ClientStatus`, `CrmClientCreate`, `CrmClientPublic`, `CrmClientsPublic`)
- API service: `frontend/src/client/sdk.gen.ts` (lines 387–431: `ClientsService.readClients`, `ClientsService.createClient`)
- UI primitives:
  - `frontend/src/components/ui/avatar.tsx` (`Avatar`, `AvatarFallback`, `AvatarImage`)
  - `frontend/src/components/ui/badge.tsx` (`Badge`, `badgeVariants`)
  - `frontend/src/components/ui/button.tsx` (`Button`, `buttonVariants`)
  - `frontend/src/components/ui/table.tsx` (`Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell`)
  - `frontend/src/components/ui/input.tsx` (`Input`)
  - `frontend/src/components/ui/dialog.tsx` (`Dialog`, `DialogContent`, etc.)
- Style tokens: `frontend/src/index.css` (lines 77–84 & 119–126: status colors `--status-active`, `--status-paused`, `--status-debt`, `--status-completed`)
- Playwright E2E tests: `frontend/tests/clients.spec.ts` (564 lines)

### 1.2 Current Implementation State of `clients.tsx`
1. **Query & Data Fetching (lines 99–106, 144)**:
   ```ts
   function getClientsQueryOptions() {
     return {
       queryFn: async () =>
         (await ClientsService.readClients({ query: { limit: 500, skip: 0 } }))
           .data,
       queryKey: ["clients", "list", 500],
     }
   }
   ```
2. **Current Filter State & Logic (lines 145–162)**:
   - State: `statusFilter` is `"all" | ClientStatus` (initial `"all"`).
   - State: `searchTerm` is `string` (initial `""`).
   - Filtering: In-memory filter on `clientsResponse.data`:
     ```ts
     const filteredClients = useMemo(() => {
       const normalizedSearch = searchTerm.trim().toLowerCase()
       return clientsResponse.data.filter((client) => {
         const matchesStatus =
           statusFilter === "all" ? true : client.status === statusFilter
         const haystack = [client.name, client.phone, client.address ?? ""]
           .join(" ")
           .toLowerCase()
         const matchesSearch =
           normalizedSearch.length === 0 || haystack.includes(normalizedSearch)
         return matchesStatus && matchesSearch
       })
     }, [clientsResponse.data, searchTerm, statusFilter])
     ```
3. **Current Status Filter UI (lines 186–203)**:
   - Uses a hidden dropdown `<Select>` with 220px fixed width:
     ```tsx
     <Select
       value={statusFilter}
       onValueChange={(value) =>
         setStatusFilter(value as "all" | ClientStatus)
       }
     >
       <SelectTrigger>
         <SelectValue placeholder="Фильтр по статусу" />
       </SelectTrigger>
       <SelectContent>
         <SelectItem value="all">Все статусы</SelectItem>
         {CLIENT_STATUSES.map((status) => (
           <SelectItem key={status} value={status}>
             {clientStatusLabels[status]}
           </SelectItem>
         ))}
       </SelectContent>
     </Select>
     ```
4. **Current Table Rendering (lines 206–266)**:
   - 6 TableHead columns: `Имя`, `Телефон`, `Адрес`, `Статус`, `Добавлен`, `Действия`.
   - Rows render plain text cells without icons, avatars, or status dot indicators.
   - Status badge uses default generic variant `clientStatusBadgeVariant[client.status]` (`default`, `secondary`, `outline`, `destructive`).
   - Empty state is a bare text cell: `<TableCell colSpan={6} ...>Не найдено клиентов, соответствующих текущим фильтрам.</TableCell>`.
5. **AddClientDialog (lines 285–466)**:
   - Uses `react-hook-form` + `zodResolver(clientFormSchema)`.
   - Creates client with `ClientsService.createClient` and invalidates `["clients"]`.
   - Crucial form fields and labels used in Playwright tests:
     - `Имя *`
     - `Телефон *`
     - `Email`
     - `Статус`
     - `Адрес`
     - `Заметки`
     - Buttons: `Добавить клиента`, `Сохранить`, `Отмена`
     - Toast: `Клиент успешно добавлен`

### 1.3 Playwright Test Selectors in `frontend/tests/clients.spec.ts`
- Line 33, 65, 78: `page.getByRole("button", { name: "Добавить клиента" })`
- Line 45, 84: `page.getByRole("link", { name: clientName })`
- Line 54: `page.getByRole("heading", { name: "Клиенты" })`
- Line 56: `page.getByText("Управление клиентской базой, статусами пакетов и заметками.")`
- Line 67–71: Dialog inspection (`page.getByRole("dialog")`, `Добавление клиента`, `Имя *`, `Телефон *`)
- Line 36, 81: `page.getByRole("button", { name: "Сохранить" })`
- Line 37, 83: `page.getByText("Клиент успешно добавлен")`
- Line 87: `page.getByText(phone)`

### 1.4 Verification Command Results
- `npm --prefix frontend run build`: Exited code 0 (`tsc -p tsconfig.build.json && vite build` built in 1.36s).

---

## 2. Logic Chain

### 2.1 Preserving Functional Integrity and Test Contracts
1. Playwright tests (`frontend/tests/clients.spec.ts`) verify heading `"Клиенты"`, description `"Управление клиентской базой, статусами пакетов и заметками."`, link to client detail by client name (`<Link to="/clients/$clientId">`), and `AddClientDialog` modal lifecycle.
2. By preserving exact route parameters, text labels, and heading tags, all existing tests will remain 100% compliant.
3. No test relies on the old `<Select>` status dropdown on `/clients`. Replacing it with horizontal filter pills is completely safe and directly satisfies Requirement R1.

### 2.2 Horizontal Filter Pills with Live Status Counts
1. Requirement R1 specifies filter pills for: `Все`, `Активные`, `С долгом`, `На паузе`, `Новые`, `Завершенные`, `Архивированные`.
2. Map these tabs to `ClientStatus`:
   - `all` -> `"Все"`
   - `active` -> `"Активные"`
   - `debt` -> `"С долгом"`
   - `paused` -> `"На паузе"`
   - `new` -> `"Новые"`
   - `completed` -> `"Завершенные"`
   - `archived` -> `"Архивированные"`
3. Live counts are computed efficiently with `useMemo` from `clientsResponse.data`:
   ```ts
   const statusCounts = useMemo(() => {
     const counts: Record<"all" | ClientStatus, number> = {
       all: clientsResponse.data.length,
       active: 0,
       debt: 0,
       paused: 0,
       new: 0,
       completed: 0,
       archived: 0,
     }
     for (const client of clientsResponse.data) {
       if (counts[client.status] !== undefined) {
         counts[client.status]++
       }
     }
     return counts
   }, [clientsResponse.data])
   ```
4. Render filter pills as a responsive horizontal scrollbar with count badges:
   - Active pill: `bg-primary text-primary-foreground font-semibold shadow-xs` with count badge `bg-primary-foreground/20 text-primary-foreground`.
   - Inactive pill: `variant="outline"` or `bg-card hover:bg-muted text-muted-foreground hover:text-foreground` with count badge `bg-muted text-muted-foreground tabular-nums`.

### 2.3 Enhanced Table Rows
1. **Avatar Circle with Initials and Colored Status Dot**:
   - Compute initials: First letters of first and last name (or first 2 chars of single name).
   - Dot indicator positioned with `absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-background`.
   - Semantic dot colors matching Design Tokens:
     - `active`: `bg-emerald-500`
     - `debt`: `bg-rose-500`
     - `paused`: `bg-amber-500`
     - `new`: `bg-sky-500`
     - `completed`: `bg-slate-400`
     - `archived`: `bg-zinc-400`
2. **Client Name**:
   - Render inside `<div className="flex items-center gap-3">` alongside Avatar.
   - Name wrapped in `<Link to="/clients/$clientId" params={{ clientId: client.id }}>` with `hover:underline font-semibold text-foreground`.
   - Optional email subtitle if provided (`text-xs text-muted-foreground truncate`).
3. **Phone with Phone Icon**:
   - Render as clickable `tel:` link: `<a href={"tel:" + client.phone} className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-primary hover:underline tabular-nums"> <Phone className="size-3.5 text-muted-foreground shrink-0" /> {client.phone} </a>`.
4. **Address with MapPin Icon**:
   - If present: `<span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground max-w-[260px] truncate" title={client.address}> <MapPin className="size-3.5 text-muted-foreground shrink-0" /> <span className="truncate">{client.address}</span> </span>`.
   - If empty: `<span className="text-muted-foreground/50 text-sm">—</span>`.
5. **Semantic Status Badge**:
   - Distinctive semantic pill badge with colored dot:
     - `active`: `bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30`
     - `debt`: `bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 font-semibold`
     - `paused`: `bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30`
     - `new`: `bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30`
     - `completed`: `bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30`
     - `archived`: `bg-muted text-muted-foreground border-border`
6. **Date Added**:
   - Formatted in `tabular-nums text-xs text-muted-foreground` using `ru-RU` locale.
7. **"Открыть" Action Button**:
   - `<Button variant="outline" size="sm" asChild className="hover:bg-primary hover:text-primary-foreground transition-colors group"> <Link to="/clients/$clientId" params={{ clientId: client.id }}> <span>Открыть</span> <ChevronRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-0.5" /> </Link> </Button>`.

### 2.4 Rich Empty State
1. Two scenarios handled gracefully:
   - **Filtered empty state** (filters or search yield 0 matches):
     - Displays `SearchX` / `Users` icon in muted circle.
     - Title: "Клиенты не найдены".
     - Description: "По текущему фильтру или поисковому запросу ничего не найдено."
     - CTA Button: "Сбросить фильтры" which resets `statusFilter` to `"all"` and `searchTerm` to `""`.
   - **Global empty state** (0 clients in database):
     - Title: "База клиентов пуста".
     - Description: "Добавьте первого клиента, чтобы начать оформление рационов питания."
     - Trigger to open `AddClientDialog`.

---

## 3. Caveats

1. **Client packages summary in list view**: The current backend endpoint `GET /api/v1/clients/` returns `CrmClientPublic[]` which includes basic client metadata (`id`, `name`, `phone`, `address`, `email`, `status`, `notes`, `created_at`, `updated_at`), but does NOT embed package lists or deliveries. Detailed package progress bars are viewed on the client detail page (`/clients/$clientId`). If inline package counts were requested in future, it would require backend contract expansion (which is frozen). The client list therefore displays client-level metadata and status with full fidelity.
2. **Search behavior**: Search runs client-side across `name`, `phone`, and `address` within the 500 loaded clients. Case-insensitive and trimmed.

---

## 4. Conclusion & Concrete Implementation Specification

The proposed replacement for `frontend/src/routes/_layout/clients.tsx` satisfies all acceptance criteria for R1:
- Visible filter pills with live counts for all 7 states (Все, Активные, С долгом, На паузе, Новые, Завершенные, Архивированные).
- Full table row enrichment (Avatar circle, initials, status dot, clickable phone with `Phone` icon, address with `MapPin` icon, semantic status badge with color coding, date added in `tabular-nums`, and "Открыть" CTA with chevron).
- Empty state with reset filters button.
- Clean TypeScript types matching `@/client`.
- 100% preservation of `AddClientDialog`, form validation, and Playwright test selectors.

### Proposed Code Implementation for `clients.tsx`

```tsx
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router"
import {
  ChevronRight,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Users,
  UserX,
  X,
} from "lucide-react"
import { Suspense, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  type ClientStatus,
  ClientsService,
  type CrmClientCreate,
} from "@/client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import useCustomToast from "@/hooks/useCustomToast"
import { cn } from "@/lib/utils"
import { handleError } from "@/utils"

const CLIENT_STATUSES = [
  "new",
  "active",
  "paused",
  "completed",
  "debt",
  "archived",
] as const

const clientStatusLabels: Record<ClientStatus, string> = {
  new: "Новый",
  active: "Активен",
  paused: "На паузе",
  completed: "Завершен",
  debt: "С долгом",
  archived: "Архивирован",
}

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
    border: "border-emerald-500/20",
  },
  debt: {
    bg: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/20",
  },
  paused: {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/20",
  },
  new: {
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-500/20",
  },
  completed: {
    bg: "bg-slate-500/10",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-500/20",
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
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15",
  },
  debt: {
    label: "С долгом",
    className:
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/15 font-semibold",
  },
  paused: {
    label: "На паузе",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/15",
  },
  new: {
    label: "Новый",
    className:
      "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/15",
  },
  completed: {
    label: "Завершен",
    className:
      "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30 hover:bg-slate-500/15",
  },
  archived: {
    label: "Архив",
    className: "bg-muted text-muted-foreground border-border hover:bg-muted/80",
  },
}

const FILTER_TABS: Array<{
  id: "all" | ClientStatus
  label: string
}> = [
  { id: "all", label: "Все" },
  { id: "active", label: "Активные" },
  { id: "debt", label: "С долгом" },
  { id: "paused", label: "На паузе" },
  { id: "new", label: "Новые" },
  { id: "completed", label: "Завершенные" },
  { id: "archived", label: "Архивированные" },
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const clientFormSchema = z.object({
  name: z.string().trim().min(1, { message: "Имя обязательно" }),
  phone: z.string().trim().min(1, { message: "Телефон обязателен" }),
  address: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /\S+@\S+\.\S+/.test(value), {
      message: "Неверный формат email",
    }),
  status: z.enum(CLIENT_STATUSES),
  notes: z.string().trim().optional(),
})

type ClientFormData = z.infer<typeof clientFormSchema>

function getClientsQueryOptions() {
  return {
    queryFn: async () =>
      (await ClientsService.readClients({ query: { limit: 500, skip: 0 } }))
        .data,
    queryKey: ["clients", "list", 500],
  }
}

const normalizeOptionalText = (value?: string) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

export const Route = createFileRoute("/_layout/clients")({
  component: ClientsPage,
  head: () => ({
    meta: [
      {
        title: "Клиенты - Meal CRM",
      },
    ],
  }),
})

function ClientsPageContent() {
  const { data: clientsResponse } = useSuspenseQuery(getClientsQueryOptions())
  const [statusFilter, setStatusFilter] = useState<"all" | ClientStatus>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const statusCounts = useMemo(() => {
    const counts: Record<"all" | ClientStatus, number> = {
      all: clientsResponse.data.length,
      active: 0,
      debt: 0,
      paused: 0,
      new: 0,
      completed: 0,
      archived: 0,
    }
    for (const client of clientsResponse.data) {
      if (counts[client.status] !== undefined) {
        counts[client.status]++
      }
    }
    return counts
  }, [clientsResponse.data])

  const filteredClients = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return clientsResponse.data.filter((client) => {
      const matchesStatus =
        statusFilter === "all" ? true : client.status === statusFilter
      const haystack = [client.name, client.phone, client.address ?? ""]
        .join(" ")
        .toLowerCase()
      const matchesSearch =
        normalizedSearch.length === 0 || haystack.includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [clientsResponse.data, searchTerm, statusFilter])

  const handleResetFilters = () => {
    setStatusFilter("all")
    setSearchTerm("")
  }

  const isFiltered = statusFilter !== "all" || searchTerm.trim().length > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Заголовок страницы и действие */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Клиенты</h1>
          <p className="text-muted-foreground text-sm">
            Управление клиентской базой, статусами пакетов и заметками.
          </p>
        </div>
        <AddClientDialog />
      </div>

      {/* Панель фильтров: поиск + горизонтальные pills */}
      <div className="flex flex-col gap-3">
        <div className="relative w-full max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9 pr-8 shadow-xs"
            placeholder="Поиск по имени, телефону или адресу"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-0.5"
              aria-label="Очистить поиск"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Горизонтальные filter pills со счетчиками */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const isSelected = statusFilter === tab.id
            const count = statusCounts[tab.id]
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap shrink-0 border cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                    : "bg-card text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[11px] font-bold tabular-nums",
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Таблица клиентов */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Клиент</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Адрес</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Добавлен</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => {
                const avatarStyle =
                  statusAvatarStyles[client.status] ?? statusAvatarStyles.new
                const badgeStyle =
                  statusBadgeStyles[client.status] ?? statusBadgeStyles.new
                const dotColor =
                  statusDotColors[client.status] ?? "bg-slate-400"

                return (
                  <TableRow key={client.id} className="group">
                    {/* Клиент: Аватар + Имя + Email */}
                    <TableCell className="font-medium whitespace-normal">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <Avatar
                            className={cn(
                              "size-9 border text-xs font-bold",
                              avatarStyle.bg,
                              avatarStyle.border
                            )}
                          >
                            <AvatarFallback
                              className={cn(
                                "bg-transparent font-bold",
                                avatarStyle.text
                              )}
                            >
                              {getInitials(client.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-background",
                              dotColor
                            )}
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <Link
                            to="/clients/$clientId"
                            params={{ clientId: client.id }}
                            className="font-semibold text-foreground hover:text-primary hover:underline transition-colors truncate"
                          >
                            {client.name}
                          </Link>
                          {client.email && (
                            <span className="text-xs text-muted-foreground truncate">
                              {client.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Телефон с иконкой */}
                    <TableCell>
                      <a
                        href={`tel:${client.phone}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary hover:underline tabular-nums transition-colors"
                      >
                        <Phone
                          className="size-3.5 text-muted-foreground shrink-0"
                          aria-hidden="true"
                        />
                        <span>{client.phone}</span>
                      </a>
                    </TableCell>

                    {/* Адрес с иконкой */}
                    <TableCell className="whitespace-normal">
                      {client.address ? (
                        <span
                          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground max-w-[260px] truncate"
                          title={client.address}
                        >
                          <MapPin
                            className="size-3.5 text-muted-foreground shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate">{client.address}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50 text-sm">
                          —
                        </span>
                      )}
                    </TableCell>

                    {/* Семантический бейдж статуса */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-2.5 py-0.5 text-xs font-medium border shadow-2xs gap-1.5",
                          badgeStyle.className
                        )}
                      >
                        <span
                          className={cn("size-1.5 rounded-full", dotColor)}
                          aria-hidden="true"
                        />
                        {badgeStyle.label}
                      </Badge>
                    </TableCell>

                    {/* Дата регистрации */}
                    <TableCell>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatDate(client.created_at)}
                      </span>
                    </TableCell>

                    {/* Кнопка "Открыть" */}
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="hover:bg-primary hover:text-primary-foreground transition-colors group/btn shadow-2xs"
                      >
                        <Link
                          to="/clients/$clientId"
                          params={{ clientId: client.id }}
                        >
                          <span>Открыть</span>
                          <ChevronRight
                            className="size-3.5 ml-1 transition-transform group-hover/btn:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-14 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3 shadow-inner">
                      {isFiltered ? (
                        <UserX className="size-6" />
                      ) : (
                        <Users className="size-6" />
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-foreground">
                      {isFiltered
                        ? "Клиенты не найдены"
                        : "Список клиентов пуст"}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs max-w-xs">
                      {isFiltered
                        ? "По текущему поисковому запросу или выбранному фильтру статуса совпадений не обнаружено."
                        : "Создайте первого клиента, чтобы начать управление рационами питания."}
                    </p>
                    {isFiltered ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="mt-4 gap-1.5"
                      >
                        <RotateCcw className="size-3.5" />
                        Сбросить фильтры
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function ClientsPage() {
  const activeRouteId = useRouterState({
    select: (state) => state.matches[state.matches.length - 1]?.routeId,
  })

  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground p-8 text-center">
          Загрузка списка клиентов…
        </div>
      }
    >
      {activeRouteId === Route.id ? <ClientsPageContent /> : <Outlet />}
    </Suspense>
  )
}

function AddClientDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      email: "",
      status: "new",
      notes: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: CrmClientCreate) =>
      ClientsService.createClient({ body: data }),
    onSuccess: () => {
      showSuccessToast("Клиент успешно добавлен")
      form.reset()
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
    },
  })

  const onSubmit = (data: ClientFormData) => {
    mutation.mutate({
      name: data.name.trim(),
      phone: data.phone.trim(),
      address: normalizeOptionalText(data.address),
      email: normalizeOptionalText(data.email),
      status: data.status,
      notes: normalizeOptionalText(data.notes),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Добавить клиента
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Добавление клиента</DialogTitle>
          <DialogDescription>
            Создайте новую карточку клиента для управления его пакетами.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Имя <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Имя клиента" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Телефон <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Номер телефона" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="client@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Статус</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите статус" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CLIENT_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {clientStatusLabels[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Адрес</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Адрес доставки" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Заметки</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Важные детали или пожелания клиента…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={mutation.isPending}>
                  Отмена
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Сохранить
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 5. Verification Method

1. **Build & Typecheck verification**:
   - Command: `npm --prefix frontend run build`
   - Expected result: Output exit code 0, TypeScript checks pass with 0 errors.
2. **Playwright E2E verification**:
   - Command: `npx playwright test frontend/tests/clients.spec.ts` (with backend running).
   - Expected result: All client list and client creation tests pass without selector mismatch.
3. **Visual & Interaction verification**:
   - Filter pill counts: "Все (N)", "Активные (N)", "С долгом (N)", "На паузе (N)", "Новые (N)", "Завершенные (N)", "Архивированные (N)" update live when status changes.
   - Table rows display:
     - Avatar circle with 2 uppercase initials + colored status dot in bottom right.
     - Clickable client name link navigating to `/clients/$clientId`.
     - Phone number with Phone icon.
     - Address with MapPin icon (or "—" if not set).
     - Semantic badge (Emerald for active, Rose for debt, Amber for paused, Sky for new, Slate for completed).
     - Registration date in Russian locale (`tabular-nums`).
     - "Открыть" button with hover chevron effect.
   - Empty state displays reset filters button when zero results match filter/search.
