"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { api } from "@/lib/trpc/client"
import { useToast } from "@/hooks/use-toast"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddressAutocomplete } from "./AddressAutocomplete"

/**
 * Project types
 */
const PROJECT_TYPES = [
  { value: "renovation", label: "Renovation" },
  { value: "new_build", label: "New Build" },
  { value: "development", label: "Development" },
  { value: "maintenance", label: "Maintenance" },
] as const

/**
 * Zod schema for form validation
 */
const formSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  streetNumber: z.string().min(1, "Street number is required"),
  streetName: z.string().min(1, "Street name is required"),
  streetType: z.string().optional(),
  suburb: z.string().min(1, "Suburb is required"),
  state: z.enum(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"], {
    errorMap: () => ({ message: "Please select a state" }),
  }),
  postcode: z
    .string()
    .regex(/^\d{4}$/, "Postcode must be 4 digits")
    .min(1, "Postcode is required"),
  projectType: z.enum(["renovation", "new_build", "development", "maintenance"], {
    errorMap: () => ({ message: "Please select a project type" }),
  }),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  totalBudget: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export interface ProjectCreateFormProps {
  /**
   * Callback fired after successful project creation
   */
  onSuccess?: (projectId: string) => void
  /**
   * Optional initial form values
   */
  defaultValues?: Partial<FormValues>
}

/**
 * ProjectCreateForm - Form component for creating new projects
 *
 * Handles project creation with address input, validation,
 * and optimistic updates. Supports manual address entry with
 * Australian state selection.
 *
 * @param onSuccess - Callback fired after successful project creation
 * @param defaultValues - Optional initial form values
 */
export function ProjectCreateForm({ onSuccess, defaultValues }: ProjectCreateFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const utils = api.useUtils()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      streetNumber: defaultValues?.streetNumber ?? "",
      streetName: defaultValues?.streetName ?? "",
      streetType: defaultValues?.streetType ?? "",
      suburb: defaultValues?.suburb ?? "",
      state: defaultValues?.state ?? undefined,
      postcode: defaultValues?.postcode ?? "",
      projectType: defaultValues?.projectType ?? undefined,
      startDate: defaultValues?.startDate ?? "",
      endDate: defaultValues?.endDate ?? "",
      totalBudget: defaultValues?.totalBudget ?? "",
    },
  })

  const createProject = api.projects.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Project created successfully",
      })
      // Invalidate projects list to refetch
      void utils.projects.list.invalidate()
      // Call success callback or navigate
      if (onSuccess) {
        onSuccess(data.id)
      } else {
        router.push("/projects" as never)
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: FormValues) => {
    // Transform form data to match API schema
    createProject.mutate({
      name: data.name,
      description: data.description || null,
      address: {
        streetNumber: data.streetNumber,
        streetName: data.streetName,
        streetType: data.streetType || null,
        suburb: data.suburb,
        state: data.state,
        postcode: data.postcode,
        country: "Australia",
      },
      projectType: data.projectType,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      totalBudget: data.totalBudget ? parseFloat(data.totalBudget) : null,
    })
  }

  const isSubmitting = createProject.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Project Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name *</FormLabel>
              <FormControl>
                <Input placeholder="My Development Project" disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  placeholder="Brief description of the project"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional project description</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address Section */}
        <AddressAutocomplete
          value={{
            streetNumber: form.watch("streetNumber"),
            streetName: form.watch("streetName"),
            streetType: form.watch("streetType"),
            suburb: form.watch("suburb"),
            state: form.watch("state"),
            postcode: form.watch("postcode"),
            country: "Australia",
          }}
          onChange={(address) => {
            if (address.streetNumber) form.setValue("streetNumber", address.streetNumber)
            if (address.streetName) form.setValue("streetName", address.streetName)
            if (address.streetType) form.setValue("streetType", address.streetType)
            if (address.suburb) form.setValue("suburb", address.suburb)
            if (address.state) form.setValue("state", address.state as FormValues["state"])
            if (address.postcode) form.setValue("postcode", address.postcode)
          }}
          disabled={isSubmitting}
        />

        {/* Project Type */}
        <FormField
          control={form.control}
          name="projectType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Type *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dates */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Start Date */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date *</FormLabel>
                <FormControl>
                  <Input type="date" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* End Date */}
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="date" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormDescription>Optional estimated completion date</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Total Budget */}
        <FormField
          control={form.control}
          name="totalBudget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Budget</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional total project budget in AUD</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
            {isSubmitting ? "Creating..." : "Create Project"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
