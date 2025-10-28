# Bug Fix: Edit Contact Dialog Not Loading Data

**Date:** 2025-10-28
**Reporter:** User
**Status:** Fixed
**Priority:** High
**Component:** Contacts Management

## Issue Description

When clicking "Edit contact" from the contacts table dropdown menu, the edit dialog would appear but:

1. No contact data was populated in the form fields
2. The submit button displayed "Create Contact" instead of "Update Contact"
3. The form behaved as if creating a new contact rather than editing

## Root Causes

### 1. Missing onClick Handler

**Location:** [columns.tsx:170](../../apps/web/src/components/contacts/columns.tsx#L170)

The "Edit contact" menu item had no `onClick` handler:

```typescript
<DropdownMenuItem>Edit contact</DropdownMenuItem>
```

**Impact:** Clicking the menu item did nothing - no dialog opened, no state updated.

### 2. Incorrect Data Structure Access

**Location:** [page.tsx:109-121](../../apps/web/src/app/contacts/page.tsx#L109-L121)

The code attempted to access contact fields directly on the API response, but the API returns a nested structure:

```typescript
// API Response Structure
{
  contact: { id, firstName, lastName, ... },  // Actual contact data
  category: { ... },                          // Related category
  address: { ... },                           // Related address
  projects: [...],                            // Related projects
  costs: [...]                                // Related costs
}
```

**Incorrect Code:**

```typescript
firstName: editContact.firstName,  // ❌ undefined
lastName: editContact.lastName,    // ❌ undefined
```

**Correct Code:**

```typescript
firstName: editContact.contact.firstName,  // ✅ works
lastName: editContact.contact.lastName,    // ✅ works
```

### 3. Form Not Remounting

**Location:** [page.tsx:108](../../apps/web/src/app/contacts/page.tsx#L108)

React Hook Form's `defaultValues` only apply when the component mounts. Without a `key` prop, editing different contacts would reuse the same component instance, preventing form values from updating.

## Solution Implemented

### 1. Wire Up Edit Callback Chain

**Added edit state management:** [page.tsx:30-62](../../apps/web/src/app/contacts/page.tsx#L30-L62)

```typescript
const [editContactId, setEditContactId] = useState<string | null>(null)

const handleEditClick = (contactId: string) => {
  setEditContactId(contactId)
}
```

**Passed callback through components:**

- [page.tsx:77](../../apps/web/src/app/contacts/page.tsx#L77) → ContactList
- [ContactList.tsx:106](../../apps/web/src/components/contacts/ContactList.tsx#L106) → DataTable
- [data-table.tsx:69-71](../../apps/web/src/components/contacts/data-table.tsx#L69-L71) → table.meta
- [columns.tsx:156](../../apps/web/src/components/contacts/columns.tsx#L156) → accessed via table.options.meta

**Wired onClick handler:** [columns.tsx:171-177](../../apps/web/src/components/contacts/columns.tsx#L171-L177)

```typescript
<DropdownMenuItem
  onClick={() => {
    if (meta?.onEditClick) {
      meta.onEditClick(contact.id)
    }
  }}
>
  Edit contact
</DropdownMenuItem>
```

### 2. Fixed Data Structure Access

**Before:**

```typescript
defaultValues={{
  firstName: editContact.firstName,        // ❌ undefined
  lastName: editContact.lastName,          // ❌ undefined
  categoryId: editContact.categoryId,      // ❌ undefined
}}
```

**After:**

```typescript
defaultValues={{
  firstName: editContact.contact.firstName,      // ✅ works
  lastName: editContact.contact.lastName,        // ✅ works
  categoryId: editContact.contact.categoryId,    // ✅ works
}}
```

### 3. Force Form Remount with Key Prop

**Added key prop:** [page.tsx:109](../../apps/web/src/app/contacts/page.tsx#L109)

```typescript
<ContactForm
  key={editContact.contact.id}  // Forces new instance per contact
  contactId={editContact.contact.id}
  defaultValues={{...}}
/>
```

This ensures React creates a new form component instance when editing different contacts, properly applying new `defaultValues`.

### 4. Added Edit Dialog UI

**Added dialog:** [page.tsx:93-128](../../apps/web/src/app/contacts/page.tsx#L93-L128)

```typescript
<Dialog open={!!editContactId} onOpenChange={(open) => !open && setEditContactId(null)}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Contact</DialogTitle>
      <DialogDescription>Update contact information...</DialogDescription>
    </DialogHeader>
    {isLoadingEditContact ? (
      <Spinner />
    ) : (
      editContact && <ContactForm {...props} />
    )}
  </DialogContent>
</Dialog>
```

## Files Changed

1. **[page.tsx](../../apps/web/src/app/contacts/page.tsx)**
   - Added `editContactId` state and handlers
   - Added `api.contacts.getById` query
   - Added edit dialog with loading state
   - Fixed data structure access to use `editContact.contact.*`
   - Added `key` prop to force form remount

2. **[ContactList.tsx](../../apps/web/src/components/contacts/ContactList.tsx)**
   - Added `onEditClick` prop to interface
   - Passed `onEditClick` to DataTable
   - Fixed TypeScript type for `item` parameter

3. **[data-table.tsx](../../apps/web/src/components/contacts/data-table.tsx)**
   - Added `onEditClick` prop to interface
   - Passed `onEditClick` to table via `meta` property

4. **[columns.tsx](../../apps/web/src/components/contacts/columns.tsx)**
   - Updated actions column to access `table` parameter
   - Retrieved `onEditClick` from table.options.meta
   - Wired onClick handler to "Edit contact" menu item

## Testing

### Manual Testing Completed

- ✅ Click "Edit contact" opens dialog
- ✅ Dialog shows loading spinner while fetching data
- ✅ Form populates with correct contact data
- ✅ All fields show existing values (name, company, email, phone, etc.)
- ✅ Button displays "Update Contact" (not "Create Contact")
- ✅ Category selector shows current category
- ✅ Saving updates the contact successfully
- ✅ Dialog closes after successful update
- ✅ Contact list refreshes with updated data
- ✅ Editing different contacts works correctly
- ✅ TypeScript compilation passes
- ✅ ESLint passes with no warnings

### User Flow

1. User navigates to Contacts page
2. User clicks ⋮ (more actions) on any contact row
3. User clicks "Edit contact" from dropdown
4. Dialog opens with loading spinner
5. Form populates with contact's current data
6. User modifies fields
7. User clicks "Update Contact"
8. Success toast appears
9. Dialog closes
10. Contact list shows updated data

## Related Components

The `ContactForm` component already supported both create and edit modes via the `contactId` prop:

- When `contactId` is provided → Update mode ("Update Contact" button)
- When `contactId` is undefined → Create mode ("Create Contact" button)

This fix leverages the existing edit functionality by properly wiring it up through the UI.

## Lessons Learned

1. **Always check API response structure** - Don't assume flat objects when APIs may return nested data with relations
2. **React Hook Form defaultValues** - Only apply on mount; use `key` prop to force remount when editing different items
3. **Callback threading** - In complex component hierarchies, use table `meta` to pass callbacks to column definitions
4. **TypeScript helps** - Proper typing would have caught the incorrect data access earlier

## References

- [ContactForm Component](../../apps/web/src/components/contacts/ContactForm.tsx)
- [contact.ts Router](../../apps/web/src/server/api/routers/contact.ts#L210)
- [React Hook Form Documentation](https://react-hook-form.com/api/useform/)
- [TanStack Table Meta](https://tanstack.com/table/v8/docs/guide/column-defs#column-meta)
