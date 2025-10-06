"use client"

import { Cross2Icon, PlusIcon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "./data-table-view-options"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { getCategoriesByType } from "@/server/db/types"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onCreateClick?: () => void
}

export function DataTableToolbar<TData>({ table, onCreateClick }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  const contactCategories = getCategoriesByType("contact")
  const parentCategories = contactCategories
    .filter((cat) => cat.parentId === null)
    .map((cat) => ({
      label: cat.displayName,
      value: cat.id,
    }))

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter contacts..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("category") && (
          <DataTableFacetedFilter
            column={table.getColumn("category")}
            title="Category"
            options={parentCategories}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <DataTableViewOptions table={table} />
        {onCreateClick && (
          <Button onClick={onCreateClick} size="sm" className="h-8">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        )}
      </div>
    </div>
  )
}
