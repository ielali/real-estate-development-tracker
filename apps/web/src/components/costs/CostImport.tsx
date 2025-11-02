"use client"

import * as React from "react"
import { useState } from "react"
import { api } from "@/lib/trpc/client"
import { toast } from "sonner"
import { readCsvFile, type CsvParseResult } from "@/lib/csv-parser"
import { detectColumnMapping } from "@/lib/validations/cost-import"
import type { ValidationResult } from "@/lib/validations/cost-import"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CostImportProps {
  projectId: string
  onSuccess?: () => void
  trigger?: React.ReactNode
}

type ImportStep = "upload" | "mapping" | "preview" | "confirm"

interface ImportState {
  step: ImportStep
  file: File | null
  csvData: CsvParseResult | null
  columnMappings: Record<string, string>
  validationResult: ValidationResult | null
  createNewVendors: boolean
  createNewCategories: boolean
}

const STEP_ORDER: ImportStep[] = ["upload", "mapping", "preview", "confirm"]

const STEP_TITLES: Record<ImportStep, string> = {
  upload: "Upload CSV File",
  mapping: "Map Columns",
  preview: "Preview & Validate",
  confirm: "Confirm Import",
}

/**
 * CostImport - Multi-step CSV import wizard for bulk cost entry
 *
 * Features:
 * - File upload with size and format validation
 * - Automatic column mapping with manual override
 * - Preview with validation errors
 * - Vendor and category creation options
 * - Transaction-based import (all-or-nothing)
 * - Audit logging
 *
 * Story 7.2 - CSV Import for Bulk Cost Entry
 */
export function CostImport({ projectId, onSuccess, trigger }: CostImportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, setState] = useState<ImportState>({
    step: "upload",
    file: null,
    csvData: null,
    columnMappings: {},
    validationResult: null,
    createNewVendors: true,
    createNewCategories: false,
  })

  const utils = api.useUtils()

  // Reset state when dialog closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setState({
        step: "upload",
        file: null,
        csvData: null,
        columnMappings: {},
        validationResult: null,
        createNewVendors: true,
        createNewCategories: false,
      })
    }
  }

  // Step navigation
  const currentStepIndex = STEP_ORDER.indexOf(state.step)
  const progressPercentage = ((currentStepIndex + 1) / STEP_ORDER.length) * 100

  const goToStep = (step: ImportStep) => {
    setState((prev) => ({ ...prev, step }))
  }

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEP_ORDER.length) {
      goToStep(STEP_ORDER[nextIndex])
    }
  }

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      goToStep(STEP_ORDER[prevIndex])
    }
  }

  // File upload handler
  const handleFileUpload = async (file: File) => {
    try {
      // Validate file type
      if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
        toast.error("Invalid file type. Please upload a CSV file (.csv or .txt)")
        return
      }

      // Parse CSV
      const csvData = await readCsvFile(file)

      // Auto-detect column mappings
      const autoMappings: Record<string, string> = {}
      csvData.headers.forEach((header) => {
        const detected = detectColumnMapping(header)
        if (detected) {
          autoMappings[header] = detected
        }
      })

      setState((prev) => ({
        ...prev,
        file,
        csvData,
        columnMappings: autoMappings,
      }))

      toast.success(`File uploaded: ${csvData.rows.length} rows detected`)
      goToNextStep()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to parse CSV file")
    }
  }

  // Validation mutation
  const validateImport = api.costs.validateImport.useMutation({
    onSuccess: (result) => {
      setState((prev) => ({ ...prev, validationResult: result }))

      if (result.isValid) {
        toast.success(`Validation passed: ${result.validRows} valid rows`)
      } else {
        toast.warning(`Validation found ${result.errorRows} rows with errors`)
      }

      goToNextStep()
    },
    onError: (error) => {
      toast.error(error.message || "Validation failed")
    },
  })

  // Import mutation
  const importCosts = api.costs.importCosts.useMutation({
    onSuccess: (result) => {
      toast.success(`Successfully imported ${result.count} costs`)

      if (result.createdVendors > 0) {
        toast.success(`Created ${result.createdVendors} new vendors`)
      }
      if (result.createdCategories > 0) {
        toast.success(`Created ${result.createdCategories} new categories`)
      }

      // Invalidate queries to refetch data
      void utils.costs.list.invalidate()

      // Close dialog and call success callback
      handleOpenChange(false)
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message || "Import failed")
    },
  })

  // Handle validation trigger
  const handleValidate = () => {
    if (!state.csvData) return

    validateImport.mutate({
      projectId,
      rows: state.csvData.rows,
      columnMappings: state.columnMappings,
    })
  }

  // Handle import execution
  const handleImport = () => {
    if (!state.csvData || !state.validationResult) return

    // Map CSV rows to ImportCostRow format
    const mappedRows = state.csvData.rows.map((row) => {
      const mapped: {
        date: string
        description: string
        amount: string
        category: string
        vendor?: string
        notes?: string
      } = {
        date: "",
        description: "",
        amount: "",
        category: "",
      }

      Object.entries(state.columnMappings).forEach(([csvColumn, dbField]) => {
        const value = row[csvColumn] || ""
        if (dbField === "date") mapped.date = value
        else if (dbField === "description") mapped.description = value
        else if (dbField === "amount") mapped.amount = value
        else if (dbField === "category") mapped.category = value
        else if (dbField === "vendor") mapped.vendor = value
        else if (dbField === "notes") mapped.notes = value
      })

      return mapped
    })

    importCosts.mutate({
      projectId,
      rows: mappedRows,
      columnMappings: state.columnMappings,
      createNewVendors: state.createNewVendors,
      createNewCategories: state.createNewCategories,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import from CSV
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{STEP_TITLES[state.step]}</DialogTitle>
          <DialogDescription>
            Import cost entries in bulk from a CSV file (Step {currentStepIndex + 1} of{" "}
            {STEP_ORDER.length})
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <Progress value={progressPercentage} className="h-2" />

        {/* Step indicator */}
        <div className="flex items-center justify-between py-4">
          {STEP_ORDER.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium",
                  index <= currentStepIndex
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted bg-background text-muted-foreground"
                )}
              >
                {index < currentStepIndex ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </div>
              {index < STEP_ORDER.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 w-12 sm:w-20",
                    index < currentStepIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[400px] py-6">
          {state.step === "upload" && <FileUploadStep onFileUpload={handleFileUpload} />}

          {state.step === "mapping" && state.csvData && (
            <ColumnMappingStep
              csvData={state.csvData}
              columnMappings={state.columnMappings}
              onMappingsChange={(mappings) =>
                setState((prev) => ({ ...prev, columnMappings: mappings }))
              }
            />
          )}

          {state.step === "preview" && state.csvData && (
            <PreviewStep
              csvData={state.csvData}
              columnMappings={state.columnMappings}
              validationResult={state.validationResult}
              isValidating={validateImport.isPending}
              onValidate={handleValidate}
            />
          )}

          {state.step === "confirm" && state.validationResult && (
            <ConfirmStep
              validationResult={state.validationResult}
              createNewVendors={state.createNewVendors}
              createNewCategories={state.createNewCategories}
              onToggleVendors={(value) =>
                setState((prev) => ({ ...prev, createNewVendors: value }))
              }
              onToggleCategories={(value) =>
                setState((prev) => ({ ...prev, createNewCategories: value }))
              }
            />
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={goToPreviousStep} disabled={currentStepIndex === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {state.step === "mapping" && (
            <Button onClick={goToNextStep}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {state.step === "preview" && !state.validationResult && (
            <Button onClick={handleValidate} disabled={validateImport.isPending}>
              {validateImport.isPending ? "Validating..." : "Validate"}
            </Button>
          )}

          {state.step === "preview" && state.validationResult && (
            <Button onClick={goToNextStep} disabled={!state.validationResult.isValid}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {state.step === "confirm" && (
            <Button onClick={handleImport} disabled={importCosts.isPending}>
              {importCosts.isPending ? "Importing..." : "Import Costs"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Step 1: File Upload
 */
interface FileUploadStepProps {
  onFileUpload: (file: File) => void
}

function FileUploadStep({ onFileUpload }: FileUploadStepProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      onFileUpload(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileUpload(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Drag & Drop area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          Drag and drop your CSV file here, or click to browse
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileInput}
          className="hidden"
        />
        <Button onClick={() => fileInputRef.current?.click()}>Browse Files</Button>
      </div>

      {/* File format instructions */}
      <div className="rounded-lg bg-muted p-4 space-y-2">
        <h4 className="font-medium text-sm">CSV Format Requirements</h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>First row must contain column headers</li>
          <li>Required columns: Date, Description, Amount, Category</li>
          <li>Optional columns: Vendor, Notes</li>
          <li>Date formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY</li>
          <li>Amount formats: 1500.00, $1,500.00, or 1.500,00 (European)</li>
          <li>Maximum file size: 10MB (supports 500+ rows)</li>
        </ul>
      </div>

      {/* Example CSV */}
      <div className="rounded-lg border p-4 space-y-2">
        <h4 className="font-medium text-sm">Example CSV Format</h4>
        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
          {`Date,Description,Amount,Category,Vendor,Notes
2024-01-15,Building materials,$1,500.00,Materials,ABC Supplies,Delivered on time
2024-01-16,Electrical work,750,Labor,John Smith Electrical,
2024-01-17,Permits and fees,450.50,Permits,City Council,Building permit`}
        </pre>
      </div>
    </div>
  )
}

/**
 * Step 2: Column Mapping
 */
interface ColumnMappingStepProps {
  csvData: CsvParseResult
  columnMappings: Record<string, string>
  onMappingsChange: (mappings: Record<string, string>) => void
}

function ColumnMappingStep({ csvData, columnMappings, onMappingsChange }: ColumnMappingStepProps) {
  const REQUIRED_FIELDS = ["date", "description", "amount", "category"]
  const OPTIONAL_FIELDS = ["vendor", "notes"]

  const handleMappingChange = (csvColumn: string, dbField: string) => {
    const newMappings = { ...columnMappings }

    // Remove this csvColumn from any previous mapping
    Object.keys(newMappings).forEach((key) => {
      if (newMappings[key] === dbField && key !== csvColumn) {
        delete newMappings[key]
      }
    })

    if (dbField === "") {
      delete newMappings[csvColumn]
    } else {
      newMappings[csvColumn] = dbField
    }

    onMappingsChange(newMappings)
  }

  // Check which required fields are mapped
  const mappedFields = new Set(Object.values(columnMappings))
  const missingRequired = REQUIRED_FIELDS.filter((field) => !mappedFields.has(field))

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm">
          Map your CSV columns to the database fields. Required fields are marked with an asterisk
          (*).
        </p>
      </div>

      {missingRequired.length > 0 && (
        <div className="rounded-lg bg-destructive/10 border border-destructive p-4">
          <p className="text-sm font-medium text-destructive">
            Missing required fields: {missingRequired.join(", ")}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {csvData.headers.map((header) => (
          <div key={header} className="flex items-center gap-4">
            <div className="flex-1 font-medium text-sm">{header}</div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <select
              value={columnMappings[header] || ""}
              onChange={(e) => handleMappingChange(header, e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Do not import</option>
              <optgroup label="Required Fields">
                {REQUIRED_FIELDS.map((field) => (
                  <option key={field} value={field}>
                    {field.charAt(0).toUpperCase() + field.slice(1)} *
                  </option>
                ))}
              </optgroup>
              <optgroup label="Optional Fields">
                {OPTIONAL_FIELDS.map((field) => (
                  <option key={field} value={field}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        ))}
      </div>

      {/* Sample data preview */}
      <div className="rounded-lg border p-4 space-y-2">
        <h4 className="font-medium text-sm">Preview (First 3 Rows)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {csvData.headers.map((header) => (
                  <th key={header} className="px-3 py-2 text-left font-medium">
                    {header}
                    {columnMappings[header] && (
                      <span className="block text-xs text-muted-foreground font-normal">
                        → {columnMappings[header]}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvData.rows.slice(0, 3).map((row, idx) => (
                <tr key={idx} className="border-b">
                  {csvData.headers.map((header) => (
                    <td key={header} className="px-3 py-2">
                      {row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/**
 * Step 3: Preview & Validation
 */
interface PreviewStepProps {
  csvData: CsvParseResult
  columnMappings: Record<string, string>
  validationResult: ValidationResult | null
  isValidating: boolean
  onValidate: () => void
}

function PreviewStep({
  csvData,
  columnMappings: _columnMappings,
  validationResult,
  isValidating: _isValidating,
  onValidate: _onValidate,
}: PreviewStepProps) {
  if (!validationResult) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-lg font-medium">Ready to Validate</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Click the Validate button below to check your CSV data for errors and match
          vendors/categories.
        </p>
        <p className="text-sm text-muted-foreground">
          {csvData.rows.length} rows will be validated
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold">{validationResult.totalRows}</div>
          <div className="text-sm text-muted-foreground">Total Rows</div>
        </div>
        <div className="rounded-lg border p-4 text-center bg-green-50 dark:bg-green-950">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {validationResult.validRows}
          </div>
          <div className="text-sm text-muted-foreground">Valid Rows</div>
        </div>
        <div className="rounded-lg border p-4 text-center bg-red-50 dark:bg-red-950">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {validationResult.errorRows}
          </div>
          <div className="text-sm text-muted-foreground">Rows with Errors</div>
        </div>
      </div>

      {/* Validation errors */}
      {validationResult.errors.length > 0 && (
        <div className="rounded-lg border border-destructive p-4 space-y-2">
          <h4 className="font-medium text-sm text-destructive">
            Validation Errors ({validationResult.errors.length})
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {validationResult.errors.slice(0, 20).map((error, idx) => (
              <div key={idx} className="text-sm bg-destructive/10 p-2 rounded">
                <span className="font-medium">Row {error.lineNumber}</span> -{" "}
                <span className="font-medium">{error.field}</span>: {error.message}
                {error.value && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Value: "{error.value}"
                  </span>
                )}
              </div>
            ))}
            {validationResult.errors.length > 20 && (
              <p className="text-xs text-muted-foreground">
                ... and {validationResult.errors.length - 20} more errors
              </p>
            )}
          </div>
        </div>
      )}

      {/* Vendor matching */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Vendor Matching</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-3">
            <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
              Matched ({validationResult.matchedVendors.length})
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {validationResult.matchedVendors.map((vendor) => (
                <div key={vendor.contactId} className="text-xs">
                  {vendor.name}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
              Unmatched ({validationResult.unmatchedVendors.length})
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {validationResult.unmatchedVendors.map((vendor, idx) => (
                <div key={idx} className="text-xs">
                  {vendor}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category matching */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Category Matching</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-3">
            <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
              Matched ({validationResult.matchedCategories.length})
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {validationResult.matchedCategories.map((category) => (
                <div key={category.categoryId} className="text-xs">
                  {category.name}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
              Unmatched ({validationResult.unmatchedCategories.length})
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {validationResult.unmatchedCategories.map((category, idx) => (
                <div key={idx} className="text-xs">
                  {category}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Step 4: Confirmation
 */
interface ConfirmStepProps {
  validationResult: ValidationResult
  createNewVendors: boolean
  createNewCategories: boolean
  onToggleVendors: (value: boolean) => void
  onToggleCategories: (value: boolean) => void
}

function ConfirmStep({
  validationResult,
  createNewVendors,
  createNewCategories,
  onToggleVendors,
  onToggleCategories,
}: ConfirmStepProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-muted p-4">
        <h3 className="font-medium mb-2">Import Summary</h3>
        <p className="text-sm text-muted-foreground">
          {validationResult.validRows} cost entries will be imported
        </p>
      </div>

      {/* Vendor creation option */}
      {validationResult.unmatchedVendors.length > 0 && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Create New Vendors</h4>
              <p className="text-sm text-muted-foreground">
                {validationResult.unmatchedVendors.length} unmatched vendors found
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={createNewVendors}
                onChange={(e) => onToggleVendors(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
          {createNewVendors && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              The following vendors will be created: {validationResult.unmatchedVendors.join(", ")}
            </div>
          )}
        </div>
      )}

      {/* Category creation option */}
      {validationResult.unmatchedCategories.length > 0 && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Create New Categories</h4>
              <p className="text-sm text-muted-foreground">
                {validationResult.unmatchedCategories.length} unmatched categories found
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={createNewCategories}
                onChange={(e) => onToggleCategories(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
          {createNewCategories && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              The following categories will be created:{" "}
              {validationResult.unmatchedCategories.join(", ")}
            </div>
          )}
        </div>
      )}

      {/* Warning about transaction */}
      <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-4">
        <h4 className="font-medium text-sm text-yellow-800 dark:text-yellow-200 mb-2">
          Transaction-Based Import
        </h4>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          This import will be executed as a single transaction. If any error occurs, all changes
          will be rolled back automatically.
        </p>
      </div>

      {/* Final confirmation */}
      <div className="rounded-lg border-2 border-primary p-4 bg-primary/5">
        <p className="text-sm font-medium text-center">
          Ready to import {validationResult.validRows} cost entries?
        </p>
      </div>
    </div>
  )
}
