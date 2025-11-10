/**
 * QuickFilterPresets - Quick filter preset buttons
 *
 * Provides one-click filters for common cost queries.
 * Highlights the active preset and allows combining with manual filters.
 */

import React from "react"
import { Calendar, DollarSign, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FilterPreset } from "@/lib/utils/cost-filters"
import { DEFAULT_FILTER_PRESETS } from "@/lib/utils/cost-filters"

export interface QuickFilterPresetsProps {
  onPresetSelect: (preset: FilterPreset) => void
  activePreset?: string
}

const PRESET_ICONS: Record<string, React.ReactNode> = {
  "last-30-days": <Calendar className="h-4 w-4" />,
  "over-1000": <DollarSign className="h-4 w-4" />,
  "this-month": <Clock className="h-4 w-4" />,
}

export function QuickFilterPresets({ onPresetSelect, activePreset }: QuickFilterPresetsProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Quick Filters</p>
      <div className="flex flex-wrap gap-2">
        {DEFAULT_FILTER_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant={activePreset === preset.id ? "default" : "outline"}
            size="sm"
            onClick={() => onPresetSelect(preset)}
            className="gap-2"
            aria-pressed={activePreset === preset.id}
            data-preset-id={preset.id}
          >
            {PRESET_ICONS[preset.id]}
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
