"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * Australian states
 */
const AUSTRALIAN_STATES = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "WA", label: "Western Australia" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "ACT", label: "Australian Capital Territory" },
  { value: "NT", label: "Northern Territory" },
] as const

interface Address {
  streetNumber: string
  streetName: string
  streetType: string
  suburb: string
  state: string
  postcode: string
  country: string
}

interface AddressAutocompleteProps {
  value: Partial<Address>
  onChange: (address: Partial<Address>) => void
  error?: string
  disabled?: boolean
}

/**
 * AddressAutocomplete - Address input with Google Places autocomplete
 *
 * Uses Google Places Autocomplete API for Australian addresses with
 * fallback to manual entry. Shows "Can't find your address?" button
 * to toggle between autocomplete and manual entry modes.
 *
 * @param value - Current address value
 * @param onChange - Callback when address changes
 * @param error - Error message to display
 * @param disabled - Whether input is disabled
 */
export function AddressAutocomplete({
  value,
  onChange,
  error,
  disabled,
}: AddressAutocompleteProps) {
  const [manualMode, setManualMode] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const autocompleteElementRef = React.useRef<google.maps.places.PlaceAutocompleteElement | null>(
    null
  )

  // Initialize Google Places Autocomplete Element
  React.useEffect(() => {
    if (manualMode || !containerRef.current) return

    // Check if Google Maps API is loaded
    if (typeof google === "undefined" || !google.maps?.importLibrary) {
      console.warn("Google Maps API not loaded, falling back to manual entry")
      setManualMode(true)
      return
    }

    async function initAutocomplete() {
      try {
        // Load the places library
        await google.maps.importLibrary("places")

        // Create PlaceAutocompleteElement with Australian region restriction
        const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
          componentRestrictions: { country: "au" },
        })

        autocompleteElementRef.current = placeAutocomplete

        // Clear container and append the autocomplete element
        if (containerRef.current) {
          containerRef.current.innerHTML = ""
          containerRef.current.appendChild(placeAutocomplete)
        }

        // Listen for place selection with gmp-select event
        placeAutocomplete.addEventListener("gmp-select", async (event: Event) => {
          // Access placePrediction from the event
          const selectEvent = event as Event & {
            placePrediction?: google.maps.places.PlacePrediction
          }
          const { placePrediction } = selectEvent

          if (!placePrediction) return

          // Convert prediction to Place and fetch address components
          const place = placePrediction.toPlace()
          await place.fetchFields({
            fields: ["addressComponents", "formattedAddress"],
          })

          // Parse address components
          const addressData: Partial<Address> = {
            country: "Australia",
          }

          if (place.addressComponents) {
            place.addressComponents.forEach((component) => {
              const types = component.types

              if (types.includes("street_number")) {
                addressData.streetNumber = component.longText || ""
              }
              if (types.includes("route")) {
                // Split route into street name and type
                const routeParts = (component.longText || "").split(" ")
                if (routeParts.length > 1) {
                  addressData.streetType = routeParts[routeParts.length - 1] || ""
                  addressData.streetName = routeParts.slice(0, -1).join(" ")
                } else {
                  addressData.streetName = component.longText || ""
                  addressData.streetType = ""
                }
              }
              if (types.includes("locality") || types.includes("postal_town")) {
                addressData.suburb = component.longText || ""
              }
              if (types.includes("administrative_area_level_1")) {
                addressData.state = component.shortText || ""
              }
              if (types.includes("postal_code")) {
                addressData.postcode = component.longText || ""
              }
            })
          }

          onChange(addressData)
        })
      } catch (err) {
        console.error("Failed to initialize Google Places Autocomplete:", err)
        setManualMode(true)
      }
    }

    void initAutocomplete()

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
      autocompleteElementRef.current = null
    }
  }, [manualMode, onChange])

  const handleManualChange = (field: keyof Address, fieldValue: string) => {
    onChange({
      ...value,
      [field]: fieldValue,
    })
  }

  if (manualMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <FormLabel>Address *</FormLabel>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setManualMode(false)}
            disabled={disabled}
          >
            Use address search
          </Button>
        </div>

        <div className="space-y-4 rounded-md border border-gray-300 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormItem>
              <FormLabel>Street Number *</FormLabel>
              <FormControl>
                <Input
                  placeholder="123"
                  value={value.streetNumber || ""}
                  onChange={(e) => handleManualChange("streetNumber", e.target.value)}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem>
              <FormLabel>Street Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Main"
                  value={value.streetName || ""}
                  onChange={(e) => handleManualChange("streetName", e.target.value)}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormItem>
              <FormLabel>Street Type</FormLabel>
              <FormControl>
                <Input
                  placeholder="Street, Road, Avenue"
                  value={value.streetType || ""}
                  onChange={(e) => handleManualChange("streetType", e.target.value)}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem>
              <FormLabel>Suburb *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Sydney"
                  value={value.suburb || ""}
                  onChange={(e) => handleManualChange("suburb", e.target.value)}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormItem>
              <FormLabel>State *</FormLabel>
              <Select
                value={value.state}
                onValueChange={(val) => handleManualChange("state", val)}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {AUSTRALIAN_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>

            <FormItem>
              <FormLabel>Postcode *</FormLabel>
              <FormControl>
                <Input
                  placeholder="2000"
                  maxLength={4}
                  value={value.postcode || ""}
                  onChange={(e) => handleManualChange("postcode", e.target.value)}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <FormLabel>Address *</FormLabel>
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => setManualMode(true)}
          disabled={disabled}
        >
          Can&apos;t find your address? Enter manually
        </Button>
      </div>

      <div className="space-y-4 rounded-md border border-gray-300 p-4">
        <FormItem>
          <FormControl>
            <div
              ref={containerRef}
              className={`rounded-md border border-input ${disabled ? "opacity-50 pointer-events-none" : ""}`}
            />
          </FormControl>
          <FormDescription>
            Start typing to search for your address. We&apos;ll auto-fill the details.
          </FormDescription>
          {error && <FormMessage>{error}</FormMessage>}
        </FormItem>

        {/* Show parsed address fields (read-only preview) */}
        {(value.streetNumber || value.suburb) && (
          <div className="rounded-md bg-gray-50 p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Selected Address:</p>
            <p className="text-sm text-gray-600">
              {[
                value.streetNumber,
                value.streetName,
                value.streetType,
                value.suburb,
                value.state,
                value.postcode,
              ]
                .filter(Boolean)
                .join(" ")}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Extend global window type to include google
declare global {
  interface Window {
    google: typeof google
  }
}
