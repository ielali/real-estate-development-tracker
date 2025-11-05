/**
 * PDF Rendering Isolation Test
 *
 * Tests React-PDF rendering in isolation to debug component issues
 */

import { describe, test, expect } from "vitest"
import {
  renderToBuffer,
  Document,
  Page,
  Text,
  View,
  Image,
  Svg,
  Path,
  Rect,
} from "@react-pdf/renderer"
import React from "react"

describe("PDF Rendering Isolation", () => {
  test("renders basic document", async () => {
    const BasicDoc = () => (
      <Document>
        <Page>
          <Text>Hello World</Text>
        </Page>
      </Document>
    )

    const buffer = await renderToBuffer(<BasicDoc />)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  test("renders SVG without style prop", async () => {
    const SvgDoc = () => (
      <Document>
        <Page>
          <View style={{ padding: 20 }}>
            <Svg width={100} height={100}>
              <Rect x={10} y={10} width={80} height={80} fill="blue" />
            </Svg>
          </View>
        </Page>
      </Document>
    )

    const buffer = await renderToBuffer(<SvgDoc />)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  test("renders SVG wrapped in View with style", async () => {
    const WrappedSvgDoc = () => (
      <Document>
        <Page>
          <View style={{ padding: 20 }}>
            <View style={{ marginRight: 5 }}>
              <Svg width={12} height={12}>
                <Rect width={12} height={12} fill="red" />
              </Svg>
            </View>
          </View>
        </Page>
      </Document>
    )

    const buffer = await renderToBuffer(<WrappedSvgDoc />)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  test("renders pie chart legend", async () => {
    const slices = [
      { label: "Category 1", percentage: 50, color: "#3b82f6" },
      { label: "Category 2", percentage: 30, color: "#10b981" },
      { label: "Category 3", percentage: 20, color: "#f59e0b" },
    ]

    const LegendDoc = () => (
      <Document>
        <Page>
          <View style={{ marginTop: 10, width: "100%" }}>
            {slices.map((slice, index) => (
              <View
                key={index}
                style={{ flexDirection: "row", alignItems: "center", marginVertical: 2 }}
              >
                <View style={{ marginRight: 5 }}>
                  <Svg width={12} height={12}>
                    <Rect width={12} height={12} fill={slice.color} />
                  </Svg>
                </View>
                <Text style={{ fontSize: 9 }}>
                  {slice.label}: {slice.percentage.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </Page>
      </Document>
    )

    const buffer = await renderToBuffer(<LegendDoc />)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  test("renders complete pie chart with paths", async () => {
    const PieChartDoc = () => {
      const width = 300
      const height = 300
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) / 2 - 20

      const data = [
        { label: "Category 1", percentage: 50, color: "#3b82f6" },
        { label: "Category 2", percentage: 30, color: "#10b981" },
        { label: "Category 3", percentage: 20, color: "#f59e0b" },
      ]

      let currentAngle = -90

      const slices = data.map((item) => {
        const angle = (item.percentage / 100) * 360
        const startAngle = currentAngle
        const endAngle = currentAngle + angle
        currentAngle = endAngle

        const startRad = (startAngle * Math.PI) / 180
        const endRad = (endAngle * Math.PI) / 180

        const x1 = centerX + radius * Math.cos(startRad)
        const y1 = centerY + radius * Math.sin(startRad)
        const x2 = centerX + radius * Math.cos(endRad)
        const y2 = centerY + radius * Math.sin(endRad)

        const largeArcFlag = angle > 180 ? 1 : 0

        const pathData = [
          `M ${centerX} ${centerY}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          "Z",
        ].join(" ")

        return {
          path: pathData,
          color: item.color,
          label: item.label,
          percentage: item.percentage,
        }
      })

      return (
        <Document>
          <Page>
            <View style={{ marginVertical: 15, alignItems: "center" }}>
              <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                {slices.map((slice, index) => (
                  <Path key={index} d={slice.path} fill={slice.color} />
                ))}
              </Svg>

              {/* Legend */}
              <View style={{ marginTop: 10, width: "100%" }}>
                {slices.map((slice, index) => (
                  <View
                    key={index}
                    style={{ flexDirection: "row", alignItems: "center", marginVertical: 2 }}
                  >
                    <View style={{ marginRight: 5 }}>
                      <Svg width={12} height={12}>
                        <Rect width={12} height={12} fill={slice.color} />
                      </Svg>
                    </View>
                    <Text style={{ fontSize: 9 }}>
                      {slice.label}: {slice.percentage.toFixed(1)}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Page>
        </Document>
      )
    }

    const buffer = await renderToBuffer(<PieChartDoc />)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
    expect(buffer.toString("utf8", 0, 4)).toBe("%PDF")
  })

  test("renders conditional content with &&", async () => {
    const hasData = true

    const ConditionalDoc = () => (
      <Document>
        <Page>
          {hasData && (
            <View>
              <Text>Has data</Text>
            </View>
          )}
        </Page>
      </Document>
    )

    const buffer = await renderToBuffer(<ConditionalDoc />)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  test("renders image with base64 data URI", async () => {
    // Simple 1x1 red pixel PNG as base64
    const redPixel =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="

    const ImageDoc = () => (
      <Document>
        <Page>
          <Image src={redPixel} style={{ width: 50, height: 50 }} />
        </Page>
      </Document>
    )

    const buffer = await renderToBuffer(<ImageDoc />)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  test("renders table row with bold text (not bold on View)", async () => {
    const TableDoc = () => (
      <Document>
        <Page>
          {/* Correct: fontWeight on Text, not View */}
          <View style={{ backgroundColor: "#f3f4f6", padding: 5 }}>
            <Text style={{ fontWeight: "bold" }}>TOTAL</Text>
            <Text style={{ fontWeight: "bold" }}>$1,000.00</Text>
          </View>
        </Page>
      </Document>
    )

    const buffer = await renderToBuffer(<TableDoc />)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  test("renders component that returns empty View (not null)", async () => {
    // Components should return empty View instead of null
    const EmptyComponent = ({ show }: { show: boolean }) => {
      if (!show) return <View />
      return (
        <View>
          <Text>Content</Text>
        </View>
      )
    }

    const EmptyComponentDoc = () => (
      <Document>
        <Page>
          <View>
            <EmptyComponent show={false} />
            <Text>Other content</Text>
          </View>
        </Page>
      </Document>
    )

    const buffer = await renderToBuffer(<EmptyComponentDoc />)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })
})
