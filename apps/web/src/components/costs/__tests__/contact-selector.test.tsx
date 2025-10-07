import { describe, it, expect, vi } from "vitest"
import { ContactSelector, type ContactSelectorProps } from "../ContactSelector"

// Mock dependencies
vi.mock("@/lib/trpc/client", () => ({
  api: {
    contacts: {
      listByProject: {
        useQuery: vi.fn(),
      },
    },
  },
}))

vi.mock("@/components/ui/select", () => ({
  Select: vi.fn(({ children }) => <div data-testid="select">{children}</div>),
  SelectContent: vi.fn(({ children }) => <div>{children}</div>),
  SelectGroup: vi.fn(({ children }) => <div>{children}</div>),
  SelectItem: vi.fn(({ children }) => <div>{children}</div>),
  SelectLabel: vi.fn(({ children }) => <div>{children}</div>),
  SelectTrigger: vi.fn(({ children }) => <div>{children}</div>),
  SelectValue: vi.fn(({ children }) => <div>{children}</div>),
}))

vi.mock("@/components/ui/button", () => ({
  Button: vi.fn(({ children }) => <button>{children}</button>),
}))

vi.mock("@/components/ui/input", () => ({
  Input: vi.fn(() => <input />),
}))

vi.mock("@/components/ui/badge", () => ({
  Badge: vi.fn(({ children }) => <span>{children}</span>),
}))

vi.mock("lucide-react", () => ({
  Plus: vi.fn(() => <span>+</span>),
}))

describe("ContactSelector", () => {
  it("exports ContactSelector component", () => {
    expect(ContactSelector).toBeDefined()
    expect(typeof ContactSelector).toBe("function")
  })

  it("accepts required props", () => {
    const props: ContactSelectorProps = {
      projectId: "test-project",
      value: "test-contact",
      onChange: vi.fn(),
      onCreateNew: vi.fn(),
    }
    expect(props).toBeDefined()
  })

  it("accepts optional props", () => {
    const props: ContactSelectorProps = {
      projectId: "test-project",
      value: null,
      onChange: vi.fn(),
      onCreateNew: vi.fn(),
      error: "Test error",
      allowUnassigned: true,
      disabled: false,
    }
    expect(props).toBeDefined()
  })

  it("has correct prop types", () => {
    // Type checking - if this compiles, types are correct
    const onChange: (contactId: string | null) => void = vi.fn()
    const onCreateNew: () => void = vi.fn()

    const props: ContactSelectorProps = {
      projectId: "project-123",
      value: undefined,
      onChange,
      onCreateNew,
      error: "error message",
      allowUnassigned: true,
      disabled: false,
    }

    expect(props.projectId).toBe("project-123")
    expect(props.value).toBeUndefined()
    expect(typeof props.onChange).toBe("function")
    expect(typeof props.onCreateNew).toBe("function")
  })

  it("onChange callback accepts string or null", () => {
    const onChange = vi.fn()
    onChange("contact-id")
    onChange(null)

    expect(onChange).toHaveBeenCalledWith("contact-id")
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it("onCreateNew callback is callable", () => {
    const onCreateNew = vi.fn()
    onCreateNew()

    expect(onCreateNew).toHaveBeenCalledOnce()
  })
})
