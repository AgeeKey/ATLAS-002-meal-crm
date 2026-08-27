import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  type ClientStatus,
  ClientsService,
  type CrmClientUpdate,
} from "@/client"
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

const clientStatusLabels: Record<ClientStatus, string> = {
  new: "Новый",
  active: "Активен",
  paused: "На паузе",
  completed: "Завершен",
  debt: "С долгом",
  archived: "Архивирован",
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

const normalizeOptionalText = (value?: string) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

interface EditClientDialogProps {
  client: {
    id: string
    name: string
    phone: string
    address?: string | null
    email?: string | null
    status: ClientStatus
    notes?: string | null
  }
}

export function EditClientDialog({ client }: EditClientDialogProps) {
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
      showSuccessToast("Данные клиента успешно обновлены")
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
        <Button variant="outline" size="sm" className="gap-1.5 shadow-2xs">
          <Pencil className="size-3.5 text-muted-foreground" />
          <span>Редактировать клиента</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Редактирование клиента</DialogTitle>
          <DialogDescription>
            Измените контактные данные, статус или заметки о клиенте.
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
                    <FormLabel>Имя</FormLabel>
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
                    <FormLabel>Телефон</FormLabel>
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
                  <FormLabel>Заметки</FormLabel>
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
                Сохранить изменения
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
