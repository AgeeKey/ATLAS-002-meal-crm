import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { NotebookPen } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { ClientsService, type CrmNoteCreate } from "@/client"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { LoadingButton } from "@/components/ui/loading-button"
import { Textarea } from "@/components/ui/textarea"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const noteFormSchema = z.object({
  text: z.string().trim().min(1, { message: "Текст заметки обязателен" }),
})

type NoteFormData = z.infer<typeof noteFormSchema>

interface AddNoteFormProps {
  clientId: string
}

export function AddNoteForm({ clientId }: AddNoteFormProps) {
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
      showSuccessToast("Заметка успешно добавлена")
      form.reset({ text: "" })
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
    },
  })

  return (
    <Card className="shadow-2xs">
      <CardContent className="py-5">
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
                  <FormLabel>Новая заметка</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Напишите заметку об этом клиенте…"
                      className="min-h-[90px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <LoadingButton
              type="submit"
              loading={mutation.isPending}
              className="gap-1.5 shadow-2xs"
            >
              <NotebookPen className="size-4" />
              <span>Сохранить заметку</span>
            </LoadingButton>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
