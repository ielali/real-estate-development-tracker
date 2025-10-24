"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api } from "@/lib/trpc/client"
import { toast } from "sonner"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * Client-side form schema for event entry
 * Validates form input before submission
 */
const eventEntryFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be under 200 characters"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  categoryId: z.enum(["milestone", "meeting", "inspection"], {
    required_error: "Event type is required",
  }),
  relatedContactIds: z.array(z.string().uuid()).default([]),
})

type FormValues = z.infer<typeof eventEntryFormSchema>

export interface EventEntryFormProps {
  /**
   * Project ID for the event
   */
  projectId: string
  /**
   * Callback fired after successful event creation
   */
  onSuccess?: () => void
  /**
   * Callback fired when cancel button is clicked
   */
  onCancel?: () => void
  /**
   * Optional initial form values
   */
  defaultValues?: Partial<FormValues>
}

/**
 * EventEntryForm - Form component for creating new events
 *
 * Handles event creation with title, description, date, and type.
 * Optimized for quick mobile entry with minimal required fields.
 *
 * Mobile-optimized with:
 * - Minimum 44x44px touch targets
 * - Vertical stacking on mobile devices
 * - Native datetime picker for mobile support
 * - Large, easy-to-tap form fields
 *
 * @param projectId - Project ID for the event
 * @param onSuccess - Callback fired after successful event creation
 * @param onCancel - Callback fired when cancel button is clicked
 * @param defaultValues - Optional initial form values
 */
export function EventEntryForm({
  projectId,
  onSuccess,
  onCancel,
  defaultValues,
}: EventEntryFormProps) {
  const utils = api.useUtils()

  // Get current date-time in local format for default value
  const now = new Date()
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  const form = useForm<FormValues>({
    resolver: zodResolver(eventEntryFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      date: defaultValues?.date ?? localDateTime,
      categoryId: defaultValues?.categoryId ?? "milestone",
      relatedContactIds: defaultValues?.relatedContactIds ?? [],
    },
  })

  const createEvent = api.events.create.useMutation({
    onSuccess: () => {
      toast.success("Event created successfully")
      form.reset()
      // Invalidate events list to refetch
      utils.events.list.invalidate({ projectId })
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create event")
    },
  })

  const onSubmit = (data: FormValues) => {
    createEvent.mutate({
      projectId,
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      categoryId: data.categoryId,
      relatedContactIds: data.relatedContactIds,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Foundation inspection"
                  disabled={createEvent.isPending}
                  className="min-h-[44px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={createEvent.isPending}
              >
                <FormControl>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date & Time</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="datetime-local"
                  disabled={createEvent.isPending}
                  className="min-h-[44px]"
                />
              </FormControl>
              <FormDescription>When did or will this event occur?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Additional details..."
                  rows={3}
                  disabled={createEvent.isPending}
                  className="resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Future enhancement: Contact selector will be added here */}
        {/* <FormField
          control={form.control}
          name="relatedContactIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Related Contacts (Optional)</FormLabel>
              <FormControl>
                <ContactMultiSelect
                  projectId={projectId}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Link this event to contacts (builder, inspector, etc.)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        /> */}

        <div className="flex gap-2 justify-end pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={createEvent.isPending}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={createEvent.isPending || !form.formState.isValid}
            className="min-h-[44px]"
          >
            {createEvent.isPending ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
