import { zodResolver } from "@hookform/resolvers/zod"
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  Calendar,
  Clock3,
  CreditCard,
  MapPin,
  NotebookPen,
  Package2,
  Phone,
  Plus,
} from "lucide-react"
import { type ReactNode, Suspense, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  type ClientStatus,
  ClientsService,
  type CrmClientUpdate,
  type CrmNoteCreate,
  type CrmPackageCreate,
  type CrmPackageDetail,
  type CrmPackageUpdate,
  type PackageStatus,
  PackagesService,
  PaymentsService,
} from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
const PACKAGE_STATUSES = ["active", "completed", "paused"] as const
const PACKAGE_MEAL_TYPES = ["3X", "5X"] as const

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
const packageFormSchema = z.object({
  meal_type: z.enum(PACKAGE_MEAL_TYPES),
  total_days: z
    .number()
    .int()
    .min(1, { message: "Total days must be at least 1" }),
  start_date: z.string().min(1, { message: "Start date is required" }),
  price: z.number().min(0, { message: "Price must be 0 or more" }),
})
const paymentFormSchema = z.object({
  amount: z.number().min(1, { message: "Amount must be at least 1" }),
  date: z.string().min(1, { message: "Date is required" }),
  comment: z.string().trim().optional(),
})
const deliveryFormSchema = z.object({
  scheduled_date: z.string().min(1, { message: "Meal date is required" }),
  sent_date: z.string().min(1, { message: "Send date is required" }),
})
const freezeFormSchema = z
  .object({
    start_date: z.string().min(1, { message: "Start date is required" }),
    end_date: z.string().min(1, { message: "End date is required" }),
    reason: z.string().trim().optional(),
  })
  .refine((value) => value.end_date >= value.start_date, {
    message: "End date must be on or after start date",
    path: ["end_date"],
  })
const extensionFormSchema = z.object({
  extra_days: z
    .number()
    .int()
    .min(1, { message: "Extra days must be at least 1" }),
  date: z.string().min(1, { message: "Date is required" }),
  reason: z.string().trim().optional(),
})
const noteFormSchema = z.object({
  text: z.string().trim().min(1, { message: "Note is required" }),
})
const packageStatusFormSchema = z.object({
  status: z.enum(PACKAGE_STATUSES),
})

type ClientFormData = z.infer<typeof clientFormSchema>
type PackageFormData = z.infer<typeof packageFormSchema>
type PaymentFormData = z.infer<typeof paymentFormSchema>
type DeliveryFormData = z.infer<typeof deliveryFormSchema>
type FreezeFormData = z.infer<typeof freezeFormSchema>
type ExtensionFormData = z.infer<typeof extensionFormSchema>
type NoteFormData = z.infer<typeof noteFormSchema>
type PackageStatusFormData = z.infer<typeof packageStatusFormSchema>

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

const packageStatusBadgeVariant: Record<
  PackageStatus,
  "default" | "secondary" | "outline"
> = {
  active: "default",
  completed: "secondary",
  paused: "outline",
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})
const MS_PER_DAY = 86400000

const normalizeOptionalText = (value?: string) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return "—"
  }

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

const shiftDate = (value: string, days: number) => {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

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
        title: "Client Detail - Meal CRM",
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

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {client.name}
              </h1>
              <Badge
                variant={clientStatusBadgeVariant[client.status]}
                className="capitalize"
              >
                {client.status}
              </Badge>
            </div>
            <div className="text-muted-foreground flex flex-col gap-2 text-sm md:flex-row md:flex-wrap md:items-center md:gap-4">
              <span className="inline-flex items-center gap-2">
                <Phone className="size-4" />
                {client.phone}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-4" />
                {client.address || "No address provided"}
              </span>
              <span>{client.email || "No email provided"}</span>
            </div>
          </div>
          <EditClientDialog client={client} />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoTile label="Created" value={formatDateTime(client.created_at)} />
          <InfoTile label="Updated" value={formatDateTime(client.updated_at)} />
          <InfoTile
            label="Packages"
            value={client.packages.length.toString()}
          />
          <InfoTile
            label="Outstanding debt"
            value={currencyFormatter.format(
              packagesWithDebt.reduce((sum, pkg) => sum + pkg.debt, 0),
            )}
          />
          {client.notes ? (
            <InfoTile label="Client notes" value={client.notes} />
          ) : null}
          {client.contact_extra ? (
            <InfoTile label="Extra contact" value={client.contact_extra} />
          ) : null}
        </CardContent>
      </Card>

      <Tabs defaultValue="packages" className="gap-4">
        <TabsList>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Packages</h2>
              <p className="text-muted-foreground text-sm">
                Manage subscriptions, payments, freezes, and extensions.
              </p>
            </div>
            <AddPackageDialog clientId={clientId} />
          </div>

          {client.packages.length > 0 ? (
            <div className="space-y-4">
              {client.packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  package={pkg}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-muted-foreground py-8 text-center">
                No packages yet. Add the first meal package to start tracking.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Notes</h2>
            <p className="text-muted-foreground text-sm">
              Capture call outcomes, preferences, and operational updates.
            </p>
          </div>
          <AddNoteForm clientId={clientId} />
          <div className="space-y-3">
            {client.client_notes.length > 0 ? (
              client.client_notes.map((note) => (
                <Card key={note.id}>
                  <CardContent className="space-y-2 py-5">
                    <p className="whitespace-pre-wrap">{note.text}</p>
                    <p className="text-muted-foreground text-sm">
                      {formatDateTime(note.created_at)}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-muted-foreground py-8 text-center">
                  No notes yet. Add the first note for this client.
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
      fallback={<div className="text-muted-foreground">Loading client…</div>}
    >
      <ClientDetailPageContent />
    </Suspense>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-lg border p-4">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm font-medium">{value}</p>
    </div>
  )
}

function EditClientDialog({
  client,
}: {
  client: {
    id: string
    name: string
    phone: string
    address?: string | null
    email?: string | null
    status: ClientStatus
    notes?: string | null
  }
}) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    mode: "onBlur",
    defaultValues: {
      name: client.name,
      phone: client.phone,
      address: client.address ?? "",
      email: client.email ?? "",
      status: client.status,
      notes: client.notes ?? "",
    },
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: client.name,
        phone: client.phone,
        address: client.address ?? "",
        email: client.email ?? "",
        status: client.status,
        notes: client.notes ?? "",
      })
    }
  }, [client, form, isOpen])

  const mutation = useMutation({
    mutationFn: (body: CrmClientUpdate) =>
      ClientsService.updateClient({ body, path: { id: client.id } }),
    onSuccess: () => {
      showSuccessToast("Client updated successfully")
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
        <Button variant="outline">Edit Client</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update contact details, current status, and summary notes.
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
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
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
                    <Input {...field} />
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
                    <Textarea {...field} />
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
                Save Changes
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function AddPackageDialog({ clientId }: { clientId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const form = useForm<PackageFormData>({
    resolver: zodResolver(packageFormSchema),
    mode: "onBlur",
    defaultValues: {
      meal_type: "3X",
      total_days: 20,
      start_date: getToday(),
      price: 0,
    },
  })

  const mutation = useMutation({
    mutationFn: (body: CrmPackageCreate) =>
      PackagesService.createPackage({ body }),
    onSuccess: () => {
      showSuccessToast("Package created successfully")
      form.reset({
        meal_type: "3X",
        total_days: 20,
        start_date: getToday(),
        price: 0,
      })
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      queryClient.invalidateQueries({ queryKey: ["packages"] })
    },
  })

  const onSubmit = (data: PackageFormData) => {
    mutation.mutate({
      client_id: clientId,
      meal_type: data.meal_type,
      total_days: data.total_days,
      start_date: data.start_date,
      price: data.price,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add Package
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Package</DialogTitle>
          <DialogDescription>
            Create a meal package and start tracking package activity.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="meal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PACKAGE_MEAL_TYPES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="total_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                Save Package
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function PackageCard({
  package: pkg,
}: {
  package: CrmPackageDetail
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const effectiveDays = pkg.total_days + pkg.extension_days
  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-lg">{pkg.meal_type} package</CardTitle>
              <Badge
                variant={packageStatusBadgeVariant[pkg.status]}
                className="capitalize"
              >
                {pkg.status}
              </Badge>
              <Badge variant={pkg.debt > 0 ? "destructive" : "secondary"}>
                Debt {currencyFormatter.format(pkg.debt)}
              </Badge>
            </div>
            <div className="grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
              <SummaryLine
                label="Total days"
                value={pkg.total_days.toString()}
              />
              <SummaryLine
                label="Effective days"
                value={effectiveDays.toString()}
              />
              <SummaryLine label="Used" value={pkg.days_used.toString()} />
              <SummaryLine
                label="Remaining"
                value={pkg.days_remaining.toString()}
              />
              <SummaryLine
                label="Price"
                value={currencyFormatter.format(pkg.price)}
              />
              <SummaryLine
                label="Paid"
                value={currencyFormatter.format(pkg.paid_amount)}
              />
              <SummaryLine
                label="Freeze days"
                value={pkg.freeze_days.toString()}
              />
              <SummaryLine
                label="Extension days"
                value={pkg.extension_days.toString()}
              />
              <SummaryLine label="Start" value={formatDate(pkg.start_date)} />
              <SummaryLine label="End" value={formatDate(pkg.end_date)} />
              <SummaryLine
                label="Deliveries"
                value={pkg.deliveries_count.toString()}
              />
              <SummaryLine
                label="Computed debt"
                value={currencyFormatter.format(pkg.debt)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <UpdatePackageStatusDialog
              packageId={pkg.id}
              currentStatus={pkg.status}
            />
            <Button
              variant="outline"
              onClick={() => setIsExpanded((value) => !value)}
            >
              {isExpanded ? "Hide Details" : "Show Details"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded ? (
        <CardContent className="grid gap-4 xl:grid-cols-2">
          <SectionCard
            title="Payments"
            action={<AddPaymentDialog packageId={pkg.id} />}
          >
            {pkg.payments.length > 0 ? (
              <div className="space-y-3">
                {pkg.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">
                        {currencyFormatter.format(payment.amount)}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDate(payment.date)}
                      </span>
                    </div>
                    {payment.comment ? (
                      <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
                        {payment.comment}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No payments recorded yet.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="Deliveries"
            action={<AddDeliveryDialog packageId={pkg.id} />}
          >
            {pkg.deliveries.length > 0 ? (
              <div className="space-y-3">
                {pkg.deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <div className="font-medium">
                      Meal date: {formatDate(delivery.scheduled_date)}
                    </div>
                    <div className="text-muted-foreground mt-1">
                      Send date: {formatDate(delivery.sent_date)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No deliveries recorded yet.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="Freezes"
            action={<AddFreezeDialog packageId={pkg.id} />}
          >
            {pkg.freezes.length > 0 ? (
              <div className="space-y-3">
                {pkg.freezes.map((freeze) => {
                  const frozenDays =
                    Math.floor(
                      (new Date(freeze.end_date).getTime() -
                        new Date(freeze.start_date).getTime()) /
                        MS_PER_DAY,
                    ) + 1

                  return (
                    <div
                      key={freeze.id}
                      className="rounded-lg border p-3 text-sm"
                    >
                      <div className="font-medium">
                        {formatDate(freeze.start_date)} →{" "}
                        {formatDate(freeze.end_date)}
                      </div>
                      <div className="text-muted-foreground mt-1">
                        Frozen days: {frozenDays}
                      </div>
                      {freeze.reason ? (
                        <div className="text-muted-foreground mt-1 whitespace-pre-wrap">
                          {freeze.reason}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No freeze entries recorded yet.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="Extensions"
            action={<AddExtensionDialog packageId={pkg.id} />}
          >
            {pkg.extensions.length > 0 ? (
              <div className="space-y-3">
                {pkg.extensions.map((extension) => (
                  <div
                    key={extension.id}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <div className="font-medium">
                      +{extension.extra_days} days on{" "}
                      {formatDate(extension.date)}
                    </div>
                    {extension.reason ? (
                      <div className="text-muted-foreground mt-1 whitespace-pre-wrap">
                        {extension.reason}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No extension entries recorded yet.
              </p>
            )}
          </SectionCard>
        </CardContent>
      ) : null}
    </Card>
  )
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <p className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string
  action: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="font-semibold">{title}</h3>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function AddPaymentDialog({ packageId }: { packageId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    mode: "onBlur",
    defaultValues: {
      amount: 1,
      date: getToday(),
      comment: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: PaymentFormData) =>
      PaymentsService.createPayment({
        body: {
          package_id: packageId,
          amount: data.amount,
          date: data.date,
          comment: normalizeOptionalText(data.comment),
        },
      }),
    onSuccess: () => {
      showSuccessToast("Payment created successfully")
      form.reset({ amount: 1, date: getToday(), comment: "" })
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["packages", "payments", packageId],
      })
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      queryClient.invalidateQueries({ queryKey: ["packages"] })
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CreditCard className="size-4" />
          Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogDescription>Record a package payment.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(event.target.valueAsNumber)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
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
                Save Payment
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function AddDeliveryDialog({
  packageId,
}: {
  packageId: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliveryFormSchema),
    mode: "onBlur",
    defaultValues: {
      scheduled_date: getToday(),
      sent_date: shiftDate(getToday(), -1),
    },
  })

  const scheduledDate = form.watch("scheduled_date")

  useEffect(() => {
    if (scheduledDate) {
      form.setValue("sent_date", shiftDate(scheduledDate, -1), {
        shouldDirty: true,
      })
    }
  }, [form, scheduledDate])

  const mutation = useMutation({
    mutationFn: (data: DeliveryFormData) =>
      PackagesService.createDelivery({
        body: {
          scheduled_date: data.scheduled_date,
          sent_date: data.sent_date,
        },
        path: { id: packageId },
      }),
    onSuccess: () => {
      showSuccessToast("Delivery created successfully")
      form.reset({
        scheduled_date: getToday(),
        sent_date: shiftDate(getToday(), -1),
      })
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      queryClient.invalidateQueries({ queryKey: ["packages"] })
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Package2 className="size-4" />
          Add Delivery
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Delivery</DialogTitle>
          <DialogDescription>
            Track the meal date and the day the package was sent.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="scheduled_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sent_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Send date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                Save Delivery
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function AddFreezeDialog({
  packageId,
}: {
  packageId: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const form = useForm<FreezeFormData>({
    resolver: zodResolver(freezeFormSchema),
    mode: "onBlur",
    defaultValues: {
      start_date: getToday(),
      end_date: getToday(),
      reason: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FreezeFormData) =>
      PackagesService.createFreeze({
        body: {
          start_date: data.start_date,
          end_date: data.end_date,
          reason: normalizeOptionalText(data.reason),
        },
        path: { id: packageId },
      }),
    onSuccess: () => {
      showSuccessToast("Freeze created successfully")
      form.reset({ start_date: getToday(), end_date: getToday(), reason: "" })
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      queryClient.invalidateQueries({ queryKey: ["packages"] })
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Clock3 className="size-4" />
          Add Freeze
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Freeze</DialogTitle>
          <DialogDescription>
            Pause a package for a date range.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
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
                Save Freeze
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function AddExtensionDialog({
  packageId,
}: {
  packageId: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const form = useForm<ExtensionFormData>({
    resolver: zodResolver(extensionFormSchema),
    mode: "onBlur",
    defaultValues: {
      extra_days: 1,
      date: getToday(),
      reason: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ExtensionFormData) =>
      PackagesService.createExtension({
        body: {
          extra_days: data.extra_days,
          date: data.date,
          reason: normalizeOptionalText(data.reason),
        },
        path: { id: packageId },
      }),
    onSuccess: () => {
      showSuccessToast("Extension created successfully")
      form.reset({ extra_days: 1, date: getToday(), reason: "" })
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      queryClient.invalidateQueries({ queryKey: ["packages"] })
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Calendar className="size-4" />
          Add Extension
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Extension</DialogTitle>
          <DialogDescription>Add extra days to the package.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="extra_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extra days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
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
                Save Extension
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function UpdatePackageStatusDialog({
  packageId,
  currentStatus,
}: {
  packageId: string
  currentStatus: PackageStatus
}) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const form = useForm<PackageStatusFormData>({
    resolver: zodResolver(packageStatusFormSchema),
    defaultValues: {
      status: currentStatus,
    },
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({ status: currentStatus })
    }
  }, [currentStatus, form, isOpen])

  const mutation = useMutation({
    mutationFn: (body: CrmPackageUpdate) =>
      PackagesService.updatePackage({ body, path: { id: packageId } }),
    onSuccess: () => {
      showSuccessToast("Package status updated successfully")
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      queryClient.invalidateQueries({ queryKey: ["packages"] })
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Update Status</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Package Status</DialogTitle>
          <DialogDescription>
            Pause, resume, or complete this package.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              mutation.mutate({ status: data.status }),
            )}
            className="space-y-4"
          >
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
                      {PACKAGE_STATUSES.map((status) => (
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
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={mutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Save Status
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function AddNoteForm({ clientId }: { clientId: string }) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    mode: "onBlur",
    defaultValues: { text: "" },
  })

  const mutation = useMutation({
    mutationFn: (body: CrmNoteCreate) =>
      ClientsService.createClientNote({ body, path: { id: clientId } }),
    onSuccess: () => {
      showSuccessToast("Note created successfully")
      form.reset({ text: "" })
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
    },
  })

  return (
    <Card>
      <CardContent className="py-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              mutation.mutate({ text: data.text.trim() }),
            )}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Add Note</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Write a note about this client"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <LoadingButton type="submit" loading={mutation.isPending}>
              <NotebookPen className="size-4" />
              Save Note
            </LoadingButton>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
