import { type NextRequest, NextResponse } from "next/server"
import { getAllTickets, createTicket, getTicketsByArea } from "@/services/ticketService"
import { Area } from "@/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const area = searchParams.get("area") as Area | null

    const tickets = area ? await getTicketsByArea(area) : await getAllTickets()
    return NextResponse.json(tickets)
  } catch (error) {
    console.error("[v0] API Error getting tickets:", error)
    return NextResponse.json({ error: "Error al obtener tickets" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ticketData = await request.json()

    if (!ticketData.area || !['DTI', 'CAM'].includes(ticketData.area)) {
      return NextResponse.json({ error: "El campo 'area' es requerido (DTI o CAM)" }, { status: 400 })
    }

    if (ticketData.area === 'CAM' && !ticketData.tipo_solicitud) {
      return NextResponse.json({ error: "El tipo de solicitud es requerido para tickets CAM" }, { status: 400 })
    }

    const ticket = await createTicket(ticketData)
    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error("[v0] API Error creating ticket:", error)
    return NextResponse.json({ error: "Error al crear ticket" }, { status: 500 })
  }
}
