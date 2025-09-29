import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, firstName, lastName, role } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Update user with custom fields
    await db
      .update(users)
      .set({
        firstName: firstName || "",
        lastName: lastName || "",
        role: role || "partner",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update user fields error:", error)
    return NextResponse.json({ error: "Failed to update user fields" }, { status: 500 })
  }
}
