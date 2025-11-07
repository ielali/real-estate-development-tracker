"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils/currency"
import { ArrowUpDown } from "lucide-react"
import { useState } from "react"

interface VendorData {
  vendorId: string | null
  vendorName: string
  company: string | null
  projectCount: number
  totalSpent: number
  avgPerProject: number
  transactionCount: number
}

interface TopVendorsTableProps {
  data: VendorData[]
}

type SortField = "vendorName" | "projectCount" | "totalSpent" | "avgPerProject" | "transactionCount"
type SortDirection = "asc" | "desc"

export function TopVendorsTable({ data }: TopVendorsTableProps) {
  const [sortField, setSortField] = useState<SortField>("totalSpent")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Vendors</CardTitle>
          <CardDescription>No vendor data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">Vendor analysis will appear here</p>
        </CardContent>
      </Card>
    )
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    const aNum = Number(aValue) || 0
    const bNum = Number(bValue) || 0
    return sortDirection === "asc" ? aNum - bNum : bNum - aNum
  })

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Vendors</CardTitle>
        <CardDescription>
          Most frequently used vendors across your portfolio • Showing {data.length} vendors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="vendorName">Vendor Name</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="projectCount">Projects</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="totalSpent">Total Spent</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="avgPerProject">Avg per Transaction</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="transactionCount">Transactions</SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((vendor, index) => (
                <TableRow key={vendor.vendorId || index}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{vendor.vendorName}</div>
                      {vendor.company && (
                        <div className="text-xs text-muted-foreground">{vendor.company}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{vendor.projectCount}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(vendor.totalSpent)}</TableCell>
                  <TableCell>{formatCurrency(vendor.avgPerProject)}</TableCell>
                  <TableCell>{vendor.transactionCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
