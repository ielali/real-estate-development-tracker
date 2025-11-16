import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { exportCostsToCSV, exportSelectedCostsToCSV } from "../export-utils"

// Mock DOM APIs
const mockCreateElement = vi.fn()
const mockCreateObjectURL = vi.fn()
const mockRevokeObjectURL = vi.fn()
const mockAppendChild = vi.fn()
const mockRemoveChild = vi.fn()
const mockClick = vi.fn()

beforeEach(() => {
  // Reset mocks
  mockCreateElement.mockReset()
  mockCreateObjectURL.mockReset()
  mockRevokeObjectURL.mockReset()
  mockAppendChild.mockReset()
  mockRemoveChild.mockReset()
  mockClick.mockReset()

  // Setup DOM mocks
  const mockLink = {
    setAttribute: vi.fn(),
    click: mockClick,
    style: {},
  }

  mockCreateElement.mockReturnValue(mockLink)
  mockCreateObjectURL.mockReturnValue("blob:mock-url")

  global.document = {
    createElement: mockCreateElement,
    body: {
      appendChild: mockAppendChild,
      removeChild: mockRemoveChild,
    },
  } as any

  global.URL = {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  } as any

  global.Blob = class Blob {
    constructor(
      public parts: any[],
      public options: any
    ) {}
  } as any
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("export-utils", () => {
  describe("exportCostsToCSV", () => {
    it("should generate CSV with correct headers", () => {
      const costs = [
        {
          description: "Test Cost",
          category: "Construction",
          contact: "John Doe",
          date: "2024-01-15T00:00:00.000Z",
          amount: 10000,
        },
      ]

      exportCostsToCSV(costs, "Test Project")

      expect(mockCreateElement).toHaveBeenCalledWith("a")
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })

    it("should escape CSV fields with commas", () => {
      const costs = [
        {
          description: "Test, with comma",
          category: "Construction",
          contact: null,
          date: "2024-01-15T00:00:00.000Z",
          amount: 10000,
        },
      ]

      exportCostsToCSV(costs, "Test Project")

      const blob = mockCreateObjectURL.mock.calls[0][0]
      expect(blob.parts[0]).toContain('"Test, with comma"')
    })

    it("should escape CSV fields with quotes", () => {
      const costs = [
        {
          description: 'Test "quoted" text',
          category: "Construction",
          contact: null,
          date: "2024-01-15T00:00:00.000Z",
          amount: 10000,
        },
      ]

      exportCostsToCSV(costs, "Test Project")

      const blob = mockCreateObjectURL.mock.calls[0][0]
      expect(blob.parts[0]).toContain('""quoted""')
    })

    it("should handle null contact field", () => {
      const costs = [
        {
          description: "Test Cost",
          category: "Construction",
          contact: null,
          date: "2024-01-15T00:00:00.000Z",
          amount: 10000,
        },
      ]

      exportCostsToCSV(costs, "Test Project")

      const blob = mockCreateObjectURL.mock.calls[0][0]
      const csvContent = blob.parts[0]
      expect(csvContent).toContain(",,") // Empty contact field
    })

    it("should include total row at the end", () => {
      const costs = [
        {
          description: "Cost 1",
          category: "Construction",
          contact: null,
          date: "2024-01-15T00:00:00.000Z",
          amount: 10000,
        },
        {
          description: "Cost 2",
          category: "Materials",
          contact: null,
          date: "2024-01-20T00:00:00.000Z",
          amount: 20000,
        },
      ]

      exportCostsToCSV(costs, "Test Project")

      const blob = mockCreateObjectURL.mock.calls[0][0]
      const csvContent = blob.parts[0]
      expect(csvContent).toContain("Total")
      expect(csvContent).toContain("$300.00") // Total of 30000 cents
    })

    it("should generate filename with project name and date", () => {
      const costs = [
        {
          description: "Test Cost",
          category: "Construction",
          contact: null,
          date: "2024-01-15T00:00:00.000Z",
          amount: 10000,
        },
      ]

      exportCostsToCSV(costs, "My Project")

      const setAttributeCalls = mockCreateElement.mock.results[0].value.setAttribute.mock.calls
      const downloadCall = setAttributeCalls.find((call: any[]) => call[0] === "download")
      expect(downloadCall[1]).toContain("my-project-costs")
      expect(downloadCall[1]).toMatch(/\d{4}-\d{2}-\d{2}/)
      expect(downloadCall[1]).toMatch(/\.csv$/)
    })

    it("should sanitize project name in filename", () => {
      const costs = [
        {
          description: "Test Cost",
          category: "Construction",
          contact: null,
          date: "2024-01-15T00:00:00.000Z",
          amount: 10000,
        },
      ]

      exportCostsToCSV(costs, "My Project / With Special Chars!")

      const setAttributeCalls = mockCreateElement.mock.results[0].value.setAttribute.mock.calls
      const downloadCall = setAttributeCalls.find((call: any[]) => call[0] === "download")
      expect(downloadCall[1]).not.toContain("/")
      expect(downloadCall[1]).not.toContain("!")
      expect(downloadCall[1]).toContain("-")
    })

    it("should add filter suffix to filename when provided", () => {
      const costs = [
        {
          description: "Test Cost",
          category: "Construction",
          contact: null,
          date: "2024-01-15T00:00:00.000Z",
          amount: 10000,
        },
      ]

      exportCostsToCSV(costs, "My Project", "filtered")

      const setAttributeCalls = mockCreateElement.mock.results[0].value.setAttribute.mock.calls
      const downloadCall = setAttributeCalls.find((call: any[]) => call[0] === "download")
      expect(downloadCall[1]).toContain("-filtered-")
    })
  })

  describe("exportSelectedCostsToCSV", () => {
    it("should call exportCostsToCSV with selected suffix", () => {
      const costs = [
        {
          description: "Test Cost",
          category: "Construction",
          contact: null,
          date: "2024-01-15T00:00:00.000Z",
          amount: 10000,
        },
      ]

      exportSelectedCostsToCSV(costs, "My Project")

      const setAttributeCalls = mockCreateElement.mock.results[0].value.setAttribute.mock.calls
      const downloadCall = setAttributeCalls.find((call: any[]) => call[0] === "download")
      expect(downloadCall[1]).toContain("-selected-")
    })
  })

  describe("date formatting", () => {
    it("should format dates as DD/MM/YYYY", () => {
      const costs = [
        {
          description: "Test Cost",
          category: "Construction",
          contact: null,
          date: "2024-01-15T00:00:00.000Z",
          amount: 10000,
        },
      ]

      exportCostsToCSV(costs, "Test Project")

      const blob = mockCreateObjectURL.mock.calls[0][0]
      const csvContent = blob.parts[0]
      expect(csvContent).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })
  })

  describe("currency formatting", () => {
    it("should format amounts with currency symbol and 2 decimals", () => {
      const costs = [
        {
          description: "Test Cost",
          category: "Construction",
          contact: null,
          date: "2024-01-15T00:00:00.000Z",
          amount: 12345, // 123.45
        },
      ]

      exportCostsToCSV(costs, "Test Project")

      const blob = mockCreateObjectURL.mock.calls[0][0]
      const csvContent = blob.parts[0]
      expect(csvContent).toContain("$123.45")
    })

    it("should handle large amounts", () => {
      const costs = [
        {
          description: "Test Cost",
          category: "Construction",
          contact: null,
          date: "2024-01-15T00:00:00.000Z",
          amount: 1234567, // 12,345.67
        },
      ]

      exportCostsToCSV(costs, "Test Project")

      const blob = mockCreateObjectURL.mock.calls[0][0]
      const csvContent = blob.parts[0]
      expect(csvContent).toContain("12,345.67")
    })
  })
})
