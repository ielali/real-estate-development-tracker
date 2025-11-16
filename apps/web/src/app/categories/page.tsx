"use client"

import { useState } from "react"
import { api } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CategoryForm } from "@/components/categories/CategoryForm"
import { CategoryArchiveDialog } from "@/components/categories/CategoryArchiveDialog"
import { Plus, Archive, FileText } from "lucide-react"
import type { Category, CategoryType } from "@/server/db/types"
import { Breadcrumb } from "@/components/ui/breadcrumb"

/**
 * CategoriesPage - Main category management page
 *
 * Features:
 * - Tabbed interface for different category types (Cost, Contact, Document, Event)
 * - View all categories (predefined + custom)
 * - Create custom categories via dialog
 * - Archive custom categories
 * - Visual distinction between predefined and custom categories
 */
export default function CategoriesPage() {
  const [selectedType, setSelectedType] = useState<CategoryType>("cost")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  const { data: categories = [], isLoading } = api.category.list.useQuery({
    type: selectedType,
    includeArchived: false,
  })

  // Separate parent and child categories
  const parentCategories = categories.filter((cat) => !cat.parentId)
  const getChildCategories = (parentId: string) =>
    categories.filter((cat) => cat.parentId === parentId)

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false)
  }

  const handleArchiveClick = (category: Category) => {
    setSelectedCategory(category)
    setArchiveDialogOpen(true)
  }

  const handleArchiveSuccess = () => {
    setArchiveDialogOpen(false)
    setSelectedCategory(null)
  }

  return (
    <>
      <div className="px-6 py-8 max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={[{ label: "Categories" }]} />
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Category Management</h1>
          <p className="mt-2 text-muted-foreground">
            Manage predefined and custom categories for costs, contacts, documents, and events
          </p>
        </div>

        {/* Category Type Tabs */}
        <Tabs
          value={selectedType}
          onValueChange={(value) => setSelectedType(value as CategoryType)}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="cost">Costs</TabsTrigger>
              <TabsTrigger value="contact">Contacts</TabsTrigger>
              <TabsTrigger value="document">Documents</TabsTrigger>
              <TabsTrigger value="event">Events</TabsTrigger>
            </TabsList>

            {/* Create Category Button */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Custom Category
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create Custom {selectedType} Category</DialogTitle>
                  <DialogDescription>
                    Add a custom category for your specific needs. Custom categories can be archived
                    later if needed.
                  </DialogDescription>
                </DialogHeader>
                <CategoryForm
                  type={selectedType}
                  onSuccess={handleCreateSuccess}
                  onCancel={() => setCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Cost Categories Tab */}
          <TabsContent value="cost" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Loading categories...</p>
                </CardContent>
              </Card>
            ) : categories.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No categories found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {parentCategories.map((parent) => {
                  const children = getChildCategories(parent.id)
                  return (
                    <Card key={parent.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{parent.displayName}</CardTitle>
                            {parent.isCustom && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Badge variant="secondary">Custom</Badge>
                                {parent.taxDeductible !== null && (
                                  <Badge variant={parent.taxDeductible ? "default" : "outline"}>
                                    {parent.taxDeductible ? "Tax Deductible" : "Not Deductible"}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          {parent.isCustom && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleArchiveClick(parent)}
                              className="h-8 w-8"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {parent.taxCategory && (
                          <CardDescription className="mt-2">
                            Tax: {parent.taxCategory.replace(/_/g, " ")}
                          </CardDescription>
                        )}
                        {parent.notes && (
                          <CardDescription className="mt-2 flex items-start gap-2">
                            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="text-xs">{parent.notes}</span>
                          </CardDescription>
                        )}
                      </CardHeader>
                      {children.length > 0 && (
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Subcategories:
                            </p>
                            <ul className="space-y-1">
                              {children.map((child) => (
                                <li
                                  key={child.id}
                                  className="flex items-center justify-between text-sm py-1"
                                >
                                  <span className="flex items-center gap-2">
                                    {child.displayName}
                                    {child.isCustom && (
                                      <Badge variant="secondary" className="text-xs">
                                        Custom
                                      </Badge>
                                    )}
                                  </span>
                                  {child.isCustom && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleArchiveClick(child)}
                                      className="h-6 w-6"
                                    >
                                      <Archive className="h-3 w-3" />
                                    </Button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Contact Categories Tab */}
          <TabsContent value="contact" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Loading categories...</p>
                </CardContent>
              </Card>
            ) : categories.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No categories found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{category.displayName}</CardTitle>
                          {category.isCustom && (
                            <Badge variant="secondary" className="mt-2">
                              Custom
                            </Badge>
                          )}
                        </div>
                        {category.isCustom && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleArchiveClick(category)}
                            className="h-8 w-8"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {category.notes && (
                        <CardDescription className="mt-2 flex items-start gap-2">
                          <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-xs">{category.notes}</span>
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Document Categories Tab */}
          <TabsContent value="document" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Loading categories...</p>
                </CardContent>
              </Card>
            ) : categories.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No categories found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{category.displayName}</CardTitle>
                          {category.isCustom && (
                            <Badge variant="secondary" className="mt-2">
                              Custom
                            </Badge>
                          )}
                        </div>
                        {category.isCustom && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleArchiveClick(category)}
                            className="h-8 w-8"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {category.notes && (
                        <CardDescription className="mt-2 flex items-start gap-2">
                          <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-xs">{category.notes}</span>
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Event Categories Tab */}
          <TabsContent value="event" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Loading categories...</p>
                </CardContent>
              </Card>
            ) : categories.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No categories found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{category.displayName}</CardTitle>
                          {category.isCustom && (
                            <Badge variant="secondary" className="mt-2">
                              Custom
                            </Badge>
                          )}
                        </div>
                        {category.isCustom && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleArchiveClick(category)}
                            className="h-8 w-8"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {category.notes && (
                        <CardDescription className="mt-2 flex items-start gap-2">
                          <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-xs">{category.notes}</span>
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Archive Dialog */}
        {selectedCategory && (
          <CategoryArchiveDialog
            category={selectedCategory}
            open={archiveDialogOpen}
            onOpenChange={setArchiveDialogOpen}
            onSuccess={handleArchiveSuccess}
          />
        )}
      </div>
    </>
  )
}
