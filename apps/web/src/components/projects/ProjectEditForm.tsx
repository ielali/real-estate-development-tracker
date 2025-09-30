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
 * Project statuses
 */
const PROJECT_STATUSES = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
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
  status: z.enum(["planning", "active", "on_hold", "completed", "archived"], {
    errorMap: () => ({ message: "Please select a status" }),
  }),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  totalBudget: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Address {
  streetNumber: string | null
  streetName: string | null
  streetType: string | null
  suburb: string | null
  state: string | null
  postcode: string | null
  formattedAddress: string | null
}

interface Project {
  id: string
  name: string
  description: string | null
  projectType: string
  status: string
  startDate: Date | null
  endDate: Date | null
  totalBudget: number | null
  address: Address | null
}

export interface ProjectEditFormProps {
  /**
   * Project to edit
   */
  project: Project
  /**
   * Callback fired after successful project update
   */
  onSuccess?: () => void
}

/**
 * ProjectEditForm - Form component for editing existing projects
 *
 * Pre-populates form with existing project data and handles updates
 * with optimistic updates and proper error handling
 *
 * @param project - The project to edit
 * @param onSuccess - Callback fired after successful project update
 */
export function ProjectEditForm({ project, onSuccess }: ProjectEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const utils = api.useUtils()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project.name,
      description: project.description ?? "",
      streetNumber: project.address?.streetNumber ?? "",
      streetName: project.address?.streetName ?? "",
      streetType: project.address?.streetType ?? "",
      suburb: project.address?.suburb ?? "",
      state: (project.address?.state as FormValues["state"]) ?? undefined,
      postcode: project.address?.postcode ?? "",
      projectType: project.projectType as FormValues["projectType"],
      status: project.status as FormValues["status"],
      startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
      endDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
      totalBudget: project.totalBudget?.toString() ?? "",
    },
  })

  const updateProject = api.projects.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project updated successfully",
      })
      // Invalidate queries to refetch
      void utils.projects.list.invalidate()
      void utils.projects.getById.invalidate({ id: project.id })
      // Call success callback or navigate
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/projects/${project.id}` as never)
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update project",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: FormValues) => {
    // Transform form data to match API schema
    updateProject.mutate({
      id: project.id,
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
      status: data.status,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      totalBudget: data.totalBudget ? parseFloat(data.totalBudget) : null,
    })
  }

  const isSubmitting = updateProject.isPending

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

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PROJECT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
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
            {isSubmitting ? "Updating..." : "Update Project"}
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
