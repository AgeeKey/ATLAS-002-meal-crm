import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { type CrmPackageCreate, PackagesService } from "@/client"
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
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const PACKAGE_MEAL_TYPES = ["3X", "5X"] as const

const packageFormSchema = z.object({
  meal_type: z.enum(PACKAGE_MEAL_TYPES),
  total_days: z
    .number()
    .int()
    .min(1, { message: "Количество дней должно быть не менее 1" }),
  start_date: z.string().min(1, { message: "Дата начала обязательна" }),
  price: z.number().min(0, { message: "Цена не может быть отрицательной" }),
})

type PackageFormData = z.infer<typeof packageFormSchema>

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

interface AddPackageDialogProps {
  clientId: string
}

export function AddPackageDialog({ clientId }: AddPackageDialogProps) {
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
      showSuccessToast("Пакет успешно добавлен")
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
        <Button className="gap-1.5 shadow-2xs">
          <Plus className="size-4" />
          <span>Добавить пакет</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить пакет</DialogTitle>
          <DialogDescription>
            Создайте пакет питания для этого клиента.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="meal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип пакета</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
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
                    <FormLabel>Кол-во дней</FormLabel>
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
                    <FormLabel>Цена</FormLabel>
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
                  <FormLabel>Дата начала</FormLabel>
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
                Сохранить пакет
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
