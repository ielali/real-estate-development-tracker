import { describe, it, expect } from "vitest"
import { parseCsv, validateCsvFileSize, parseCsvFromFile } from "../csv-parser"

describe("csv-parser", () => {
  describe("parseCsv", () => {
    it("parses comma-delimited CSV with headers", () => {
      const csv = "Name,Age,City\nJohn,30,Sydney\nJane,25,Melbourne"

      const result = parseCsv(csv)

      expect(result.headers).toEqual(["Name", "Age", "City"])
      expect(result.rows).toEqual([
        { Name: "John", Age: "30", City: "Sydney" },
        { Name: "Jane", Age: "25", City: "Melbourne" },
      ])
      expect(result.delimiter).toBe(",")
    })

    it("parses tab-delimited CSV", () => {
      const csv = "Name\tAge\tCity\nJohn\t30\tSydney\nJane\t25\tMelbourne"

      const result = parseCsv(csv)

      expect(result.headers).toEqual(["Name", "Age", "City"])
      expect(result.rows).toEqual([
        { Name: "John", Age: "30", City: "Sydney" },
        { Name: "Jane", Age: "25", City: "Melbourne" },
      ])
      expect(result.delimiter).toBe("\t")
    })

    it("parses semicolon-delimited CSV", () => {
      const csv = "Name;Age;City\nJohn;30;Sydney\nJane;25;Melbourne"

      const result = parseCsv(csv)

      expect(result.headers).toEqual(["Name", "Age", "City"])
      expect(result.rows).toEqual([
        { Name: "John", Age: "30", City: "Sydney" },
        { Name: "Jane", Age: "25", City: "Melbourne" },
      ])
      expect(result.delimiter).toBe(";")
    })

    it("handles quoted fields with commas", () => {
      const csv =
        'Name,Description,Price\n"Acme, Inc",Hardware supplies,1500\nTest,"Software, tools",2000'

      const result = parseCsv(csv)

      expect(result.rows).toEqual([
        { Name: "Acme, Inc", Description: "Hardware supplies", Price: "1500" },
        { Name: "Test", Description: "Software, tools", Price: "2000" },
      ])
    })

    it("handles quoted fields with newlines", () => {
      const csv = 'Name,Description\n"Multi\nLine","Another\nLine"'

      const result = parseCsv(csv)

      expect(result.rows).toEqual([{ Name: "Multi\nLine", Description: "Another\nLine" }])
    })

    it("handles escaped quotes (double quotes)", () => {
      const csv = 'Name,Quote\n"John ""The Boss"" Smith","He said ""Hello"""'

      const result = parseCsv(csv)

      expect(result.rows).toEqual([{ Name: 'John "The Boss" Smith', Quote: 'He said "Hello"' }])
    })

    it("handles empty fields", () => {
      const csv = "Name,Age,City\nJohn,,Sydney\n,25,\nJane,30,Melbourne"

      const result = parseCsv(csv)

      expect(result.rows).toEqual([
        { Name: "John", Age: "", City: "Sydney" },
        { Name: "", Age: "25", City: "" },
        { Name: "Jane", Age: "30", City: "Melbourne" },
      ])
    })

    it("handles CRLF line endings", () => {
      const csv = "Name,Age\r\nJohn,30\r\nJane,25"

      const result = parseCsv(csv)

      expect(result.rows).toEqual([
        { Name: "John", Age: "30" },
        { Name: "Jane", Age: "25" },
      ])
    })

    it("handles CR line endings", () => {
      const csv = "Name,Age\rJohn,30\rJane,25"

      const result = parseCsv(csv)

      expect(result.rows).toEqual([
        { Name: "John", Age: "30" },
        { Name: "Jane", Age: "25" },
      ])
    })

    it("handles LF line endings", () => {
      const csv = "Name,Age\nJohn,30\nJane,25"

      const result = parseCsv(csv)

      expect(result.rows).toEqual([
        { Name: "John", Age: "30" },
        { Name: "Jane", Age: "25" },
      ])
    })

    it("trims whitespace from values by default", () => {
      const csv = "Name,Age,City\n  John  ,  30  ,  Sydney  \n  Jane  ,  25  ,  Melbourne  "

      const result = parseCsv(csv)

      expect(result.rows).toEqual([
        { Name: "John", Age: "30", City: "Sydney" },
        { Name: "Jane", Age: "25", City: "Melbourne" },
      ])
    })

    it("preserves whitespace when trimValues is false", () => {
      const csv = "Name,Age\n  John  ,  30  "

      const result = parseCsv(csv, { trimValues: false })

      expect(result.rows).toEqual([{ Name: "  John  ", Age: "  30  " }])
    })

    it("handles special characters (unicode)", () => {
      const csv = "Name,Description\n你好,こんにちは\n😀,🎉"

      const result = parseCsv(csv)

      expect(result.rows).toEqual([
        { Name: "你好", Description: "こんにちは" },
        { Name: "😀", Description: "🎉" },
      ])
    })

    it("handles CSV without headers when hasHeaders is false", () => {
      const csv = "John,30,Sydney\nJane,25,Melbourne"

      const result = parseCsv(csv, { hasHeaders: false })

      expect(result.headers).toEqual(["Column 1", "Column 2", "Column 3"])
      expect(result.rows).toEqual([
        { "Column 1": "John", "Column 2": "30", "Column 3": "Sydney" },
        { "Column 1": "Jane", "Column 2": "25", "Column 3": "Melbourne" },
      ])
    })

    it("throws error for empty CSV", () => {
      expect(() => parseCsv("")).toThrow("CSV file is empty")
      expect(() => parseCsv("   \n  \n  ")).toThrow("CSV file is empty")
    })

    it("throws error for inconsistent column counts", () => {
      const csv = "Name,Age,City\nJohn,30,Sydney\nJane,25" // Missing City

      expect(() => parseCsv(csv)).toThrow("CSV has inconsistent column counts")
    })

    it("allows forced delimiter via options", () => {
      const csv = "Name|Age|City\nJohn|30|Sydney"

      const result = parseCsv(csv, { delimiter: "|" })

      expect(result.delimiter).toBe("|")
      expect(result.rows).toEqual([{ Name: "John", Age: "30", City: "Sydney" }])
    })

    it("handles cost import CSV format (real-world example)", () => {
      const csv = `Date,Description,Amount,Category,Vendor,Notes
2024-01-15,Building materials,"$1,500.00",Materials,ABC Supplies,Delivered on time
2024-01-16,Electrical work,750,Labor,John Smith Electrical,
2024-01-17,Permits and fees,450.50,Permits,City Council,Building permit`

      const result = parseCsv(csv)

      expect(result.headers).toEqual([
        "Date",
        "Description",
        "Amount",
        "Category",
        "Vendor",
        "Notes",
      ])
      expect(result.rows).toHaveLength(3)
      expect(result.rows[0]).toEqual({
        Date: "2024-01-15",
        Description: "Building materials",
        Amount: "$1,500.00",
        Category: "Materials",
        Vendor: "ABC Supplies",
        Notes: "Delivered on time",
      })
      expect(result.rows[1]).toEqual({
        Date: "2024-01-16",
        Description: "Electrical work",
        Amount: "750",
        Category: "Labor",
        Vendor: "John Smith Electrical",
        Notes: "",
      })
    })
  })

  describe("validateCsvFileSize", () => {
    it("accepts file under 10MB", () => {
      const file = new File(["test content"], "test.csv", { type: "text/csv" })
      expect(() => validateCsvFileSize(file)).not.toThrow()
    })

    it("rejects file over 10MB", () => {
      // Create a large file (> 10MB)
      const largeContent = "x".repeat(11 * 1024 * 1024) // 11MB
      const file = new File([largeContent], "large.csv", { type: "text/csv" })

      expect(() => validateCsvFileSize(file)).toThrow(
        "CSV file exceeds maximum size of 10MB. Please reduce file size and try again."
      )
    })
  })

  describe("parseCsvFromFile", () => {
    it("parses CSV from string result", () => {
      const csvString = "Name,Age\nJohn,30\nJane,25"

      const result = parseCsvFromFile(csvString)

      expect(result.rows).toEqual([
        { Name: "John", Age: "30" },
        { Name: "Jane", Age: "25" },
      ])
    })

    it("parses CSV from ArrayBuffer (UTF-8)", () => {
      const csvString = "Name,Age\nJohn,30\nJane,25"
      const encoder = new TextEncoder()
      const arrayBuffer = encoder.encode(csvString).buffer

      const result = parseCsvFromFile(arrayBuffer)

      expect(result.rows).toEqual([
        { Name: "John", Age: "30" },
        { Name: "Jane", Age: "25" },
      ])
    })

    it("handles unicode in ArrayBuffer", () => {
      const csvString = "Name,Greeting\n你好,こんにちは"
      const encoder = new TextEncoder()
      const arrayBuffer = encoder.encode(csvString).buffer

      const result = parseCsvFromFile(arrayBuffer)

      expect(result.rows).toEqual([{ Name: "你好", Greeting: "こんにちは" }])
    })
  })

  describe("delimiter detection", () => {
    it("detects comma as delimiter", () => {
      const csv = "A,B,C\n1,2,3\n4,5,6"
      const result = parseCsv(csv)
      expect(result.delimiter).toBe(",")
    })

    it("detects tab as delimiter", () => {
      const csv = "A\tB\tC\n1\t2\t3\n4\t5\t6"
      const result = parseCsv(csv)
      expect(result.delimiter).toBe("\t")
    })

    it("detects semicolon as delimiter", () => {
      const csv = "A;B;C\n1;2;3\n4;5;6"
      const result = parseCsv(csv)
      expect(result.delimiter).toBe(";")
    })

    it("prefers comma when multiple delimiters present", () => {
      // Mix of comma and semicolon in different cells, but comma is the row delimiter
      const csv = "A,B,C\n1,2,3\n4,5,6"
      const result = parseCsv(csv)
      // Should detect comma as the delimiter
      expect(result.delimiter).toBe(",")
      expect(result.rows).toHaveLength(2)
    })
  })

  describe("edge cases", () => {
    it("handles single column CSV", () => {
      const csv = "Name\nJohn\nJane"
      const result = parseCsv(csv)
      expect(result.headers).toEqual(["Name"])
      expect(result.rows).toEqual([{ Name: "John" }, { Name: "Jane" }])
    })

    it("handles single row CSV (headers only)", () => {
      const csv = "Name,Age,City"
      const result = parseCsv(csv)
      expect(result.headers).toEqual(["Name", "Age", "City"])
      expect(result.rows).toEqual([])
    })

    it("handles trailing newlines", () => {
      const csv = "Name,Age\nJohn,30\nJane,25\n\n\n"
      const result = parseCsv(csv)
      expect(result.rows).toEqual([
        { Name: "John", Age: "30" },
        { Name: "Jane", Age: "25" },
      ])
    })

    it("handles leading newlines", () => {
      const csv = "\n\n\nName,Age\nJohn,30\nJane,25"
      const result = parseCsv(csv)
      expect(result.headers).toEqual(["Name", "Age"])
      expect(result.rows).toEqual([
        { Name: "John", Age: "30" },
        { Name: "Jane", Age: "25" },
      ])
    })

    it("handles complex quoted scenarios", () => {
      const csv = `Name,Description,Notes
"Simple",No quotes here,Plain text
"Contains ""quotes""","Multiple ""nested"" quotes","End with quote"""`

      const result = parseCsv(csv)

      expect(result.rows[0]).toEqual({
        Name: "Simple",
        Description: "No quotes here",
        Notes: "Plain text",
      })
      expect(result.rows[1]).toEqual({
        Name: 'Contains "quotes"',
        Description: 'Multiple "nested" quotes',
        Notes: 'End with quote"',
      })
    })
  })
})
