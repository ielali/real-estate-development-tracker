import { describe, it, expect, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import { ContactForm } from "../ContactForm"
import React from "react"
import { TRPCWrapper } from "@/test/test-utils"

describe("ContactForm", () => {
  afterEach(() => {
    cleanup()
  })

  describe("Rendering", () => {
    it("renders all required form fields", () => {
      render(
        <TRPCWrapper>
          <ContactForm />
        </TRPCWrapper>
      )

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument()
      expect(screen.getByText(/^category/i)).toBeInTheDocument()
      expect(screen.getByRole("combobox")).toBeInTheDocument() // Category selector
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^phone$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/mobile/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/website/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    })

    it("marks required fields with asterisk", () => {
      render(
        <TRPCWrapper>
          <ContactForm />
        </TRPCWrapper>
      )

      const firstNameLabel = screen.getByText(/first name/i).closest("label")
      const categoryLabel = screen.getByText(/^category$/i).closest("label")

      expect(firstNameLabel?.textContent).toContain("*")
      expect(categoryLabel?.textContent).toContain("*")
    })

    it("shows Create Contact button for new contact", () => {
      render(
        <TRPCWrapper>
          <ContactForm />
        </TRPCWrapper>
      )

      expect(screen.getByRole("button", { name: /create contact/i })).toBeInTheDocument()
    })

    it("shows Update Contact button when editing", () => {
      render(
        <TRPCWrapper>
          <ContactForm contactId="123" />
        </TRPCWrapper>
      )

      expect(screen.getByRole("button", { name: /update contact/i })).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("associates labels with inputs", () => {
      render(
        <TRPCWrapper>
          <ContactForm />
        </TRPCWrapper>
      )

      const firstNameInput = screen.getByLabelText(/first name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/^phone$/i)

      expect(firstNameInput).toBeInTheDocument()
      expect(emailInput).toBeInTheDocument()
      expect(phoneInput).toBeInTheDocument()
    })

    it("marks required fields with aria-required", () => {
      render(
        <TRPCWrapper>
          <ContactForm />
        </TRPCWrapper>
      )

      const firstNameInput = screen.getByLabelText(/first name/i)
      expect(firstNameInput).toHaveAttribute("aria-required", "true")
    })
  })

  describe("Default Values", () => {
    it("populates form with default values when provided", () => {
      const defaultValues = {
        firstName: "John",
        lastName: "Smith",
        company: "ABC Plumbing",
        email: "john@abc.com",
        phone: "1234567890",
        categoryId: "plumber",
      }

      render(
        <TRPCWrapper>
          <ContactForm defaultValues={defaultValues} />
        </TRPCWrapper>
      )

      expect(screen.getByDisplayValue("John")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Smith")).toBeInTheDocument()
      expect(screen.getByDisplayValue("ABC Plumbing")).toBeInTheDocument()
      expect(screen.getByDisplayValue("john@abc.com")).toBeInTheDocument()
      expect(screen.getByDisplayValue("1234567890")).toBeInTheDocument()
    })
  })

  describe("Mobile Responsiveness", () => {
    it("uses grid layout for form fields", () => {
      const { container } = render(
        <TRPCWrapper>
          <ContactForm />
        </TRPCWrapper>
      )

      const grid = container.querySelector(".grid")
      expect(grid).toBeInTheDocument()
    })
  })
})
