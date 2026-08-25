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
import { Plus, Search } from "lucide-react"
import { Suspense, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  type ClientStatus,
  ClientsService,
  type CrmClientCreate,
} from "@/client"
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
import { handleError } from "@/utils"

const CLIENT_STATUSES = [
  "new",
  "active",
  "paused",
  "completed",
  "debt",
  "archived",
] as const

const clientFormSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  phone: z.string().trim().min(1, { message: "Phone is required" }),
  address: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /\S+@\S+\.\S+/.test(value), {
      message: "Invalid email address",
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

const clientStatusBadgeVariant: Record<
  ClientStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  new: "secondary",
  active: "default",
  paused: "outline",
  completed: "secondary",
  debt: "destructive",
  archived: "outline",
}

const normalizeOptionalText = (value?: string) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

export const Route = createFileRoute("/_layout/clients")({
  component: ClientsPage,
  head: () => ({
    meta: [
      {
        title: "Clients - Meal CRM",
      },
    ],
  }),
})

function ClientsPageContent() {
  const { data: clientsResponse } = useSuspenseQuery(getClientsQueryOptions())
  const [statusFilter, setStatusFilter] = useState<"all" | ClientStatus>("all")
  const [searchTerm, setSearchTerm] = useState("")

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Track customers, package activity, and notes in one place.
          </p>
        </div>
        <AddClientDialog />
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9"
            placeholder="Search by name, phone, or address"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as "all" | ClientStatus)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {CLIENT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium whitespace-normal">
                  <Link
                    to="/clients/$clientId"
                    params={{ clientId: client.id }}
                    className="hover:underline"
                  >
                    {client.name}
                  </Link>
                </TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell className="whitespace-normal">
                  {client.address || "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={clientStatusBadgeVariant[client.status]}
                    className="capitalize"
                  >
                    {client.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(client.created_at)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to="/clients/$clientId"
                      params={{ clientId: client.id }}
                    >
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={6}
                className="text-muted-foreground py-12 text-center"
              >
                No clients found for the current filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function ClientsPage() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <Suspense
      fallback={<div className="text-muted-foreground">Loading clients…</div>}
    >
      {pathname.startsWith("/clients/") ? <Outlet /> : <ClientsPageContent />}
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
      showSuccessToast("Client created successfully")
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
          Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Client</DialogTitle>
          <DialogDescription>
            Create a new CRM contact and start managing packages right away.
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
                      Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Client name" />
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
                      Phone <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Phone number" />
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
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CLIENT_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
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
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Delivery address" />
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Important client details or onboarding notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={mutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Save
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
