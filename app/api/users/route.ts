import { type NextRequest, NextResponse } from "next/server"
import { getAllUsers, createUser } from "@/services/userService"
import { emailService } from "@/services/emailService"

export async function GET() {
  try {
    const users = await getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error("[v0] API Error getting users:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()
    const user = await createUser(userData)

    // Send invitation email asynchronously (non-blocking)
    emailService.sendInvitationEmail(user.email, user.name, user.role, user.area ?? null)
      .then(sent => {
        if (sent) console.log(`[AXIS] Invitation email sent to ${user.email}`)
        else console.warn(`[AXIS] Could not send invitation to ${user.email} — check email credentials`)
      })
      .catch(e => console.error('[AXIS] Invitation email error:', e))

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("[v0] API Error creating user:", error)
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
  }
}
