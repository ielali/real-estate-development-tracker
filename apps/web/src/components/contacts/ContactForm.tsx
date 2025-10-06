"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CategorySelector } from "./CategorySelector"
import { contactFormSchema, type ContactFormData } from "@/lib/validations/contact"
import { Loader2 } from "lucide-react"

export interface ContactFormProps {
  /**
   * Callback fired after successful contact creation or update
   */
  onSuccess?: (contactId: string) => void
  /**
   * Callback fired when form is cancelled
   */
  onCancel?: () => void
  /**
   * Optional initial form values for editing
   */
  defaultValues?: Partial<ContactFormData>
  /**
   * Contact ID for editing (if provided, form will update instead of create)
   */
  contactId?: string
}

/**
 * ContactForm - Form component for creating and editing contacts
 *
 * Handles contact creation and updates with validation.
 * Includes hierarchical category selection, optional fields,
 * and duplicate detection.
 *
 * Mobile-optimized with:
 * - Minimum 44x44px touch targets
 * - Vertical stacking on mobile devices
 * - Large, easy-to-tap form fields
 *
 * @param onSuccess - Callback fired after successful operation
 * @param onCancel - Callback fired when form is cancelled
 * @param defaultValues - Optional initial form values
 * @param contactId - Contact ID for editing
 */
export function ContactForm({
  onSuccess,
  onCancel,
  defaultValues,
  contactId,
}: ContactFormProps): JSX.Element {
  const utils = api.useUtils()
  const isEditing = !!contactId

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: defaultValues?.firstName ?? "",
      lastName: defaultValues?.lastName ?? "",
      company: defaultValues?.company ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      mobile: defaultValues?.mobile ?? "",
      website: defaultValues?.website ?? "",
      categoryId: defaultValues?.categoryId ?? "",
      notes: defaultValues?.notes ?? "",
      addressId: defaultValues?.addressId ?? null,
    },
  })

  const createContact = api.contacts.create.useMutation({
    onSuccess: (data) => {
      toast.success("Contact created successfully")
      void utils.contacts.list.invalidate()
      form.reset()
      if (onSuccess) {
        onSuccess(data.id)
      }
    },
    onError: (error) => {
      if (error.message.includes("already exists")) {
        toast.error("A contact with this name and company already exists")
      } else {
        toast.error("Failed to create contact. Please try again.")
      }
    },
  })

  const updateContact = api.contacts.update.useMutation({
    onSuccess: (data) => {
      toast.success("Contact updated successfully")
      void utils.contacts.list.invalidate()
      void utils.contacts.getById.invalidate(contactId)
      if (onSuccess) {
        onSuccess(data.id)
      }
    },
    onError: (error) => {
      if (error.message.includes("already exists")) {
        toast.error("A contact with this name and company already exists")
      } else {
        toast.error("Failed to update contact. Please try again.")
      }
    },
  })

  const onSubmit = (values: ContactFormData) => {
    if (isEditing) {
      updateContact.mutate({
        id: contactId,
        ...values,
      })
    } else {
      createContact.mutate(values)
    }
  }

  const isSubmitting = createContact.isPending || updateContact.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Name fields - stacked on mobile, side-by-side on tablet+ */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  First Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="John"
                    disabled={isSubmitting}
                    aria-required="true"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Smith"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Company and Category */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="ABC Plumbing"
                    disabled={isSubmitting}
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
                <FormLabel>
                  Category <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <CategorySelector
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    placeholder="Select category"
                  />
                </FormControl>
                <FormDescription>Select the type of contact</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact information */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="email"
                    placeholder="john@example.com"
                    disabled={isSubmitting}
                  />
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
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="tel"
                    placeholder="(02) 1234 5678"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Mobile and Website */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="tel"
                    placeholder="0412 345 678"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="url"
                    placeholder="https://example.com"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Additional notes about this contact..."
                  disabled={isSubmitting}
                  rows={4}
                />
              </FormControl>
              <FormDescription>Optional notes or additional information</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
                ? "Update Contact"
                : "Create Contact"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
