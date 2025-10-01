"use client"

import { useEffect, useRef } from "react"

interface ProjectMapProps {
  address: {
    streetNumber: string | null
    streetName: string | null
    streetType: string | null
    suburb: string | null
    state: string | null
    postcode: string | null
    formattedAddress: string | null
  }
  className?: string
}

/**
 * ProjectMap - Display Google Maps centered on project address
 *
 * Shows an embedded Google Map with a marker at the project location
 */
export function ProjectMap({ address, className = "" }: ProjectMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)

  useEffect(() => {
    if (!mapRef.current || !address.formattedAddress) return

    // Initialize map
    const initMap = async () => {
      const { Map } = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary
      const { Marker } = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary

      // Geocode the address
      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ address: address.formattedAddress! }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location

          // Create map
          if (mapRef.current) {
            mapInstanceRef.current = new Map(mapRef.current, {
              center: location,
              zoom: 16,
              mapTypeControl: true,
              streetViewControl: true,
              fullscreenControl: true,
            })

            // Add marker
            markerRef.current = new Marker({
              map: mapInstanceRef.current,
              position: location,
              title: address.formattedAddress || "Project Location",
            })
          }
        }
      })
    }

    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => initMap()
      document.head.appendChild(script)
    } else {
      initMap()
    }

    return () => {
      // Cleanup
      if (markerRef.current) {
        markerRef.current.setMap(null)
      }
    }
  }, [address.formattedAddress])

  if (!address.formattedAddress) {
    return null
  }

  return (
    <div
      ref={mapRef}
      className={`w-full h-[400px] rounded-lg ${className}`}
      style={{ minHeight: "400px" }}
    />
  )
}
