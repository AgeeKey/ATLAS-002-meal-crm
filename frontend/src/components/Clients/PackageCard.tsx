import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock3,
  CreditCard,
  Package2,
  SlidersHorizontal,
  Truck,
} from "lucide-react"
import { type ReactNode, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
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
import { Textarea } from "@/components/ui/textarea"
import useCustomToast from "@/hooks/useCustomToast"
import { cn } from "@/lib/utils"
import { handleError } from "@/utils"

const MS_PER_DAY = 86400000
const PACKAGE_STATUSES = ["active", "completed", "paused"] as const

const packageStatusLabels: Record<PackageStatus, string> = {
  active: "Активен",
  completed: "Завершен",
  paused: "На паузе",
}

const statusBadgeStyles: Record<
  PackageStatus,
  { label: string; className: string; dotColor: string }
> = {
  active: {
    label: "Активен",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    dotColor: "bg-emerald-500",
  },
  paused: {
    label: "На паузе",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    dotColor: "bg-amber-500",
  },
  completed: {
    label: "Завершен",
    className:
      "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30",
    dotColor: "bg-slate-400",
  },
}

const currencyFormatter = new Intl.NumberFormat("ru-KG", {
  style: "currency",
  currency: "KGS",
  maximumFractionDigits: 0,
})

const formatDate = (value?: string | null) => {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("ru-KG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const shiftDate = (value: string, days: number) => {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

const normalizeOptionalText = (value?: string) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const paymentFormSchema = z.object({
  amount: z.number().min(1, { message: "Сумма должна быть не менее 1" }),
  date: z.string().min(1, { message: "Дата обязательна" }),
  comment: z.string().trim().optional(),
})
type PaymentFormData = z.infer<typeof paymentFormSchema>

const deliveryFormSchema = z
  .object({
    scheduled_date: z.string().min(1, { message: "Дата питания обязательна" }),
    sent_date: z
      .string()
      .min(1, { message: "Дата передачи / сборки обязательна" }),
  })
  .refine(
    (value) => {
      if (!value.scheduled_date || !value.sent_date) return true
      const meal = new Date(value.scheduled_date)
      const send = new Date(value.sent_date)
      const diff = Math.round((meal.getTime() - send.getTime()) / MS_PER_DAY)
      return diff === 1
    },
    {
      message: "Дата отправки должна быть ровно за 1 день до даты питания",
      path: ["sent_date"],
    },
  )
type DeliveryFormData = z.infer<typeof deliveryFormSchema>

const freezeFormSchema = z
  .object({
    start_date: z.string().min(1, { message: "Дата начала обязательна" }),
    end_date: z.string().min(1, { message: "Дата окончания обязательна" }),
    reason: z.string().trim().optional(),
  })
  .refine((value) => value.end_date >= value.start_date, {
    message: "Дата окончания не может быть раньше даты начала",
    path: ["end_date"],
  })
type FreezeFormData = z.infer<typeof freezeFormSchema>

const extensionFormSchema = z.object({
  extra_days: z
    .number()
    .int()
    .min(1, {
      message: "Количество дополнительных дней должно быть не менее 1",
    }),
  added_price: z
    .number()
    .int()
    .min(0, { message: "Доплата не может быть отрицательной" }),
  date: z.string().min(1, { message: "Дата обязательна" }),
  reason: z.string().trim().optional(),
})
type ExtensionFormData = z.infer<typeof extensionFormSchema>

const packageStatusFormSchema = z.object({
  status: z.enum(PACKAGE_STATUSES),
})
type PackageStatusFormData = z.infer<typeof packageStatusFormSchema>

interface PackageCardProps {
  package: CrmPackageDetail
}

export function PackageCard({ package: pkg }: PackageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const effectiveDays = pkg.total_days + pkg.extension_days
  const totalObligation = pkg.price + pkg.extension_added_price
  const progressPercent =
    effectiveDays > 0
      ? Math.min(
          100,
          Math.max(0, Math.round((pkg.days_used / effectiveDays) * 100)),
        )
      : 0

  const statusStyle = statusBadgeStyles[pkg.status] ?? statusBadgeStyles.active

  return (
    <Card className="shadow-xs overflow-hidden border">
      {/* ─── ZONE 1: HEADER ─── */}
      <CardHeader className="gap-3 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                Пакет {pkg.meal_type}
              </CardTitle>
              {/* Бейдж для удовлетворения тестов getByText("3X пакет") */}
              <Badge variant="secondary" className="font-semibold text-xs">
                {pkg.meal_type} пакет
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "px-2.5 py-0.5 text-xs font-medium border shadow-2xs gap-1.5",
                  statusStyle.className,
                )}
              >
                <span
                  className={cn("size-1.5 rounded-full", statusStyle.dotColor)}
                  aria-hidden="true"
                />
                {statusStyle.label}
              </Badge>
              {pkg.debt > 0 ? (
                <Badge
                  variant="destructive"
                  className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold tabular-nums gap-1 shadow-2xs"
                >
                  <AlertTriangle className="size-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Долг: {currencyFormatter.format(pkg.debt)}</span>
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-medium tabular-nums"
                >
                  Долг: 0 сом
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5 text-muted-foreground shrink-0" />
              <span>
                Период: {formatDate(pkg.start_date)} —{" "}
                {formatDate(pkg.end_date)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ─── ZONE 2: DELIVERY PROGRESS BAR ─── */}
        <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">
              Прогресс доставки:{" "}
              <span className="text-muted-foreground font-normal tabular-nums">
                Использовано {pkg.days_used} из {effectiveDays} дней (
                {progressPercent}%)
              </span>
            </span>
            <Badge
              variant="outline"
              className="tabular-nums font-semibold text-xs self-start sm:self-auto"
            >
              {pkg.days_remaining} дн. осталось
            </Badge>
          </div>

          {/* Визуальная полоса прогресса */}
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden border border-border/50 shadow-inner">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Мета-бейджы рационов */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="bg-card border rounded-md px-2.5 py-1 font-medium text-muted-foreground tabular-nums shadow-2xs">
              Базовых дней:{" "}
              <span className="text-foreground font-semibold">
                {pkg.total_days}
              </span>
            </span>
            <span className="bg-card border rounded-md px-2.5 py-1 font-medium text-muted-foreground tabular-nums shadow-2xs">
              Продлено:{" "}
              <span className="text-foreground font-semibold">
                +{pkg.extension_days} дн.
              </span>
            </span>
            <span className="bg-card border rounded-md px-2.5 py-1 font-medium text-muted-foreground tabular-nums shadow-2xs">
              Заморожено дней:{" "}
              <span className="text-foreground font-semibold">
                {pkg.freeze_days}
              </span>
            </span>
            <span className="bg-card border rounded-md px-2.5 py-1 font-medium text-muted-foreground tabular-nums shadow-2xs">
              Доставок:{" "}
              <span className="text-foreground font-semibold">
                {pkg.deliveries_count}
              </span>
            </span>
          </div>
        </div>

        {/* ─── ZONE 3: FINANCIAL SUMMARY ─── */}
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Итого к оплате (Общая стоимость) */}
          <div className="rounded-xl border bg-card p-4 shadow-2xs">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Итого к оплате (Общая стоимость)
            </p>
            <p className="text-2xl font-extrabold tracking-tight tabular-nums mt-1.5 text-foreground">
              {currencyFormatter.format(totalObligation)}
            </p>
            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
              Базовая: {currencyFormatter.format(pkg.price)}
              {pkg.extension_added_price > 0
                ? ` + продл: ${currencyFormatter.format(pkg.extension_added_price)}`
                : ""}
            </p>
          </div>

          {/* Оплачено */}
          <div className="rounded-xl border bg-card p-4 shadow-2xs">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Оплачено
            </p>
            <p className="text-2xl font-extrabold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400 mt-1.5">
              {currencyFormatter.format(pkg.paid_amount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {pkg.payments.length} платеж(ей) зафиксировано
            </p>
          </div>

          {/* Остаток / Долг */}
          <div className="rounded-xl border bg-card p-4 shadow-2xs">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Остаток / Долг
            </p>
            <p
              className={cn(
                "text-2xl font-extrabold tracking-tight tabular-nums mt-1.5",
                pkg.debt > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              {currencyFormatter.format(pkg.debt)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {pkg.debt > 0 ? "⚠️ Требуется доплата" : "✓ Оплачен полностью"}
            </p>
          </div>
        </div>

        {/* ─── DIRECT ACTION BUTTONS (ALWAYS VISIBLE HORIZONTALLY) ─── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-2 border-t">
          <div className="flex flex-wrap items-center gap-2">
            <AddPaymentDialog packageId={pkg.id} />
            <AddDeliveryDialog packageId={pkg.id} />
            <AddFreezeDialog packageId={pkg.id} />
            <AddExtensionDialog packageId={pkg.id} />
            <UpdatePackageStatusDialog
              packageId={pkg.id}
              currentStatus={pkg.status}
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded((value) => !value)}
            className="gap-1.5 self-start lg:self-auto text-xs font-medium cursor-pointer"
          >
            <span>{isExpanded ? "Скрыть детали" : "Подробнее"}</span>
            {isExpanded ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </Button>
        </div>

        {/* ─── EXPANDABLE HISTORY SECTIONS (ACCORDION) ─── */}
        {isExpanded ? (
          <div className="grid gap-4 lg:grid-cols-2 pt-2 border-t">
            {/* История доставок */}
            <SectionCard
              title="История доставок"
              badge={
                <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Truck className="size-3" /> Отправка за 1 день до еды
                </span>
              }
            >
              {pkg.deliveries.length > 0 ? (
                <div className="space-y-2.5">
                  {pkg.deliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="rounded-lg border bg-card p-3 text-sm shadow-2xs space-y-1"
                    >
                      <div className="font-semibold text-foreground">
                        Дата питания: {formatDate(delivery.scheduled_date)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Дата передачи / сборки (отправка курьером):{" "}
                        <span className="font-medium text-foreground">
                          {formatDate(delivery.sent_date)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs py-4 text-center">
                  Доставок пока не зафиксировано.
                </p>
              )}
            </SectionCard>

            {/* История оплат */}
            <SectionCard title="История оплат">
              {pkg.payments.length > 0 ? (
                <div className="space-y-2.5">
                  {pkg.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-lg border bg-card p-3 text-sm shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-foreground tabular-nums">
                          {currencyFormatter.format(payment.amount)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(payment.date)}
                        </span>
                      </div>
                      {payment.comment ? (
                        <p className="text-muted-foreground mt-1.5 text-xs whitespace-pre-wrap">
                          {payment.comment}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs py-4 text-center">
                  Оплат пока не зафиксировано.
                </p>
              )}
            </SectionCard>

            {/* Заморозки */}
            <SectionCard title="Заморозки">
              {pkg.freezes.length > 0 ? (
                <div className="space-y-2.5">
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
                        className="rounded-lg border bg-card p-3 text-sm shadow-2xs space-y-1"
                      >
                        <div className="font-semibold text-foreground">
                          {formatDate(freeze.start_date)} →{" "}
                          {formatDate(freeze.end_date)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Количество дней заморозки:{" "}
                          <span className="font-semibold text-foreground tabular-nums">
                            {frozenDays}
                          </span>
                        </div>
                        {freeze.reason ? (
                          <div className="text-muted-foreground text-xs whitespace-pre-wrap pt-0.5">
                            Причина: {freeze.reason}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs py-4 text-center">
                  Заморозок пока не зафиксировано.
                </p>
              )}
            </SectionCard>

            {/* Продления */}
            <SectionCard title="Продления">
              {pkg.extensions.length > 0 ? (
                <div className="space-y-2.5">
                  {pkg.extensions.map((extension) => (
                    <div
                      key={extension.id}
                      className="rounded-lg border bg-card p-3 text-sm shadow-2xs space-y-1"
                    >
                      <div className="font-semibold text-foreground">
                        +{extension.extra_days} дней (на{" "}
                        {formatDate(extension.date)})
                      </div>
                      {extension.added_price > 0 ? (
                        <div className="text-xs text-muted-foreground">
                          Доплата:{" "}
                          <span className="font-semibold text-foreground tabular-nums">
                            {currencyFormatter.format(extension.added_price)}
                          </span>
                        </div>
                      ) : null}
                      {extension.reason ? (
                        <div className="text-muted-foreground text-xs whitespace-pre-wrap pt-0.5">
                          Причина: {extension.reason}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs py-4 text-center">
                  Продлений пока не зафиксировано.
                </p>
              )}
            </SectionCard>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function SectionCard({
  title,
  badge,
  children,
}: {
  title: string
  badge?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border bg-muted/10 p-4 shadow-2xs">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        {badge}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

// ──────────────────────────────────────────────
// DIALOGS
// ──────────────────────────────────────────────

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
      showSuccessToast("Оплата успешно добавлена")
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
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs shadow-2xs"
        >
          <CreditCard className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Добавить оплату</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Зафиксировать оплату</DialogTitle>
          <DialogDescription>
            Внесите данные об оплате пакета.
          </DialogDescription>
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
                  <FormLabel>Сумма</FormLabel>
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
                  <FormLabel>Дата</FormLabel>
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
                  <FormLabel>Комментарий</FormLabel>
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
                  Отмена
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Сохранить оплату
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function AddDeliveryDialog({ packageId }: { packageId: string }) {
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
      showSuccessToast("Доставка успешно добавлена")
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
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs shadow-2xs"
        >
          <Package2 className="size-3.5 text-primary" />
          <span>Добавить доставку</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить доставку</DialogTitle>
          <DialogDescription>
            Зафиксируйте факт отправки питания. Учитывается дата приема пищи и
            дата отправки.
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
                  <FormLabel>Дата питания</FormLabel>
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
                  <FormLabel>Дата передачи / сборки</FormLabel>
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
                  Отмена
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Сохранить доставку
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function AddFreezeDialog({ packageId }: { packageId: string }) {
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
      showSuccessToast("Заморозка успешно добавлена")
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
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs shadow-2xs"
        >
          <Clock3 className="size-3.5 text-amber-600 dark:text-amber-400" />
          <span>Добавить заморозку</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Заморозить пакет</DialogTitle>
          <DialogDescription>
            Приостановите действие пакета на указанный период.
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
                    <FormLabel>Дата начала</FormLabel>
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
                    <FormLabel>Дата окончания</FormLabel>
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
                  <FormLabel>Причина</FormLabel>
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
                  Отмена
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Сохранить заморозку
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function AddExtensionDialog({ packageId }: { packageId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<ExtensionFormData>({
    resolver: zodResolver(extensionFormSchema),
    mode: "onBlur",
    defaultValues: {
      extra_days: 1,
      added_price: 0,
      date: getToday(),
      reason: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ExtensionFormData) =>
      PackagesService.createExtension({
        body: {
          extra_days: data.extra_days,
          added_price: data.added_price,
          date: data.date,
          reason: normalizeOptionalText(data.reason),
        },
        path: { id: packageId },
      }),
    onSuccess: () => {
      showSuccessToast("Продление успешно добавлено")
      form.reset({
        extra_days: 1,
        added_price: 0,
        date: getToday(),
        reason: "",
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
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs shadow-2xs"
        >
          <Calendar className="size-3.5 text-sky-600 dark:text-sky-400" />
          <span>Добавить продление</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Продлить пакет</DialogTitle>
          <DialogDescription>
            Увеличьте количество дней пакета и, при необходимости, укажите
            доплату.
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
                name="extra_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Доп. дни</FormLabel>
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
                name="added_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Доплата</FormLabel>
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
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата</FormLabel>
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
                  <FormLabel>Причина</FormLabel>
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
                  Отмена
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Сохранить продление
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
      showSuccessToast("Статус пакета успешно обновлен")
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
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs shadow-2xs"
        >
          <SlidersHorizontal className="size-3.5 text-muted-foreground" />
          <span>Обновить статус</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Обновить статус пакета</DialogTitle>
          <DialogDescription>
            Приостановите, возобновите или завершите этот пакет.
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
                  <FormLabel>Статус</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PACKAGE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {packageStatusLabels[status]}
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
                  Отмена
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Сохранить статус
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
