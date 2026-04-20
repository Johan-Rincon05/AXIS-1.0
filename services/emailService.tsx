import nodemailer from "nodemailer"

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Sistema de notificaciones por WhatsApp eliminado
// Las notificaciones por WhatsApp serán gestionadas por el bot de WhatsApp

interface TicketNotificationData {
  ticketId: string
  title: string
  description: string
  priority: string
  status: string
  assignedTo?: string
  createdBy: string
  createdAt: string
  resolutionMessage?: string
  wasResolved?: boolean
  deleteMessage?: string
  deletedBy?: string
  phoneNumber?: string // Número de teléfono para WhatsApp
}

class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    // Solo crear el transporter si las credenciales están disponibles
    if (process.env.HOSTINGER_EMAIL_USER && process.env.HOSTINGER_EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.HOSTINGER_EMAIL_USER,
        pass: process.env.HOSTINGER_EMAIL_PASS,
      },
    })
    } else {
      // Crear un transporter mock para evitar errores durante el build
      this.transporter = null as any
    }
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter || !process.env.HOSTINGER_EMAIL_USER || !process.env.HOSTINGER_EMAIL_PASS) {
        console.warn("[EmailService] Email credentials not configured or transporter not available")
        return false
      }

      const mailOptions = {
        from: `"FixIT System" <${process.env.HOSTINGER_EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log("[EmailService] Email sent successfully:", result.messageId)
      return true
    } catch (error) {
      console.error("[EmailService] Error sending email:", error)
      return false
    }
  }

  async sendTicketCreatedNotification(data: TicketNotificationData, recipientEmail: string): Promise<boolean> {
    const priorityColor =
      {
        Baja: "#10b981",
        Media: "#f59e0b",
        Alta: "#ef4444",
        Crítica: "#dc2626",
      }[data.priority] || "#6b7280"

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .ticket-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .priority { display: inline-block; padding: 4px 12px; border-radius: 20px; color: white; font-size: 12px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎫 Nuevo Ticket Creado</h1>
            </div>
            <div class="content">
              <p>Se ha creado un nuevo ticket en el sistema FixIT:</p>
              
              <div class="ticket-info">
                <h3>${data.title}</h3>
                <p><strong>ID:</strong> ${data.ticketId}</p>
                <p><strong>Descripción:</strong> ${data.description}</p>
                <p><strong>Prioridad:</strong> <span class="priority" style="background-color: ${priorityColor}">${data.priority}</span></p>
                <p><strong>Estado:</strong> ${data.status}</p>
                <p><strong>Creado por:</strong> ${data.createdBy}</p>
                <p><strong>Fecha:</strong> ${new Date(data.createdAt).toLocaleString("es-ES")}</p>
                ${data.assignedTo ? `<p><strong>Asignado a:</strong> ${data.assignedTo}</p>` : ""}
              </div>
              
              <p>Puedes revisar y gestionar este ticket accediendo al sistema FixIT.</p>
            </div>
            <div class="footer">
              <p>Este es un mensaje automático del sistema FixIT</p>
            </div>
          </div>
        </body>
      </html>
    `

    const emailResult = await this.sendEmail({
      to: recipientEmail,
      subject: `[FixIT] Nuevo Ticket: ${data.title}`,
      html,
      text: `Nuevo ticket creado: ${data.title}\nID: ${data.ticketId}\nPrioridad: ${data.priority}\nDescripción: ${data.description}`,
    })

    // Las notificaciones por WhatsApp serán gestionadas por el bot de WhatsApp

    return emailResult
  }

  async sendTicketUpdatedNotification(
    data: TicketNotificationData,
    recipientEmail: string,
    updateType: string,
  ): Promise<boolean> {
    const priorityColor =
      {
        Baja: "#10b981",
        Media: "#f59e0b",
        Alta: "#ef4444",
        Crítica: "#dc2626",
      }[data.priority] || "#6b7280"

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .ticket-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .priority { display: inline-block; padding: 4px 12px; border-radius: 20px; color: white; font-size: 12px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔄 Ticket Actualizado</h1>
            </div>
            <div class="content">
              <p>El ticket <strong>${data.ticketId}</strong> ha sido actualizado:</p>
              
              <div class="ticket-info">
                <h3>${data.title}</h3>
                <p><strong>Tipo de actualización:</strong> ${updateType}</p>
                <p><strong>Estado actual:</strong> ${data.status}</p>
                <p><strong>Prioridad:</strong> <span class="priority" style="background-color: ${priorityColor}">${data.priority}</span></p>
                ${data.assignedTo ? `<p><strong>Asignado a:</strong> ${data.assignedTo}</p>` : ""}
                ${data.resolutionMessage ? `
                  <div style="margin-top: 15px; padding: 10px; background-color: ${data.wasResolved ? '#d1fae5' : '#fee2e2'}; border-radius: 6px; border-left: 4px solid ${data.wasResolved ? '#10b981' : '#ef4444'};">
                    <p><strong>${data.wasResolved ? '✅ Problema Resuelto' : '❌ Problema No Resuelto'}</strong></p>
                    <p><strong>Mensaje de resolución:</strong></p>
                    <p style="margin-top: 5px; font-style: italic;">${data.resolutionMessage}</p>
                  </div>
                ` : ""}
                ${data.deleteMessage ? `
                  <div style="margin-top: 15px; padding: 10px; background-color: #fef2f2; border-radius: 6px; border-left: 4px solid #ef4444;">
                    <p><strong>🗑️ Ticket Eliminado</strong></p>
                    <p><strong>Eliminado por:</strong> ${data.deletedBy || 'Administrador'}</p>
                    <p><strong>Motivo de eliminación:</strong></p>
                    <p style="margin-top: 5px; font-style: italic;">${data.deleteMessage}</p>
                  </div>
                ` : ""}
              </div>
              
              <p>Puedes revisar los detalles completos accediendo al sistema FixIT.</p>
            </div>
            <div class="footer">
              <p>Este es un mensaje automático del sistema FixIT</p>
            </div>
          </div>
        </body>
      </html>
    `

    const emailResult = await this.sendEmail({
      to: recipientEmail,
      subject: `[FixIT] Actualización de Ticket: ${data.title}`,
      html,
      text: `Ticket actualizado: ${data.title}\nID: ${data.ticketId}\nTipo: ${updateType}\nEstado: ${data.status}`,
    })

    // Las notificaciones por WhatsApp serán gestionadas por el bot de WhatsApp

    return emailResult
  }

  async sendInvitationEmail(
    userEmail: string,
    userName: string,
    role: string,
    area?: string | null,
  ): Promise<boolean> {
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://axis-axissystem-zfzurp-ac0caf-85-31-231-55.traefik.me'

    // Role display label
    const roleLabels: Record<string, string> = {
      SuperUser: 'Super Usuario',
      Gerente: 'Gerente',
      Coordinador: 'Coordinador',
      Asistencia: 'Técnico de Asistencia',
      Empleado: 'Colaborador',
    }
    const roleLabel = roleLabels[role] ?? role

    // Role badge color
    const roleBadgeStyle: Record<string, string> = {
      SuperUser: 'background:#fda4af;color:#9f1239;',
      Gerente: 'background:#fcd34d;color:#92400e;',
      Coordinador: 'background:#93c5fd;color:#1e3a8a;',
      Asistencia: 'background:#c4b5fd;color:#4c1d95;',
      Empleado: 'background:#d4d4d8;color:#27272a;',
    }
    const badgeStyle = roleBadgeStyle[role] ?? 'background:#d4d4d8;color:#27272a;'

    const areaLine = area
      ? ` &middot; <strong style="color:#a5b4fc;">Área ${area}</strong>`
      : ''

    // Features per role
    const features: Record<string, { icon: string; title: string; desc: string }[]> = {
      SuperUser: [
        { icon: '👥', title: 'Gestión de Usuarios', desc: 'Crea, activa e inactiva usuarios de todas las áreas de la organización.' },
        { icon: '🏢', title: 'Gestión de Áreas', desc: 'Administra las áreas solicitantes y define la estructura organizacional.' },
        { icon: '📊', title: 'Dashboard Global', desc: 'Métricas de progreso en tiempo real por área y por persona.' },
      ],
      Gerente: [
        { icon: '📋', title: 'Vista Completa de Tickets', desc: 'Accede a todos los tickets activos y resueltos de tu área.' },
        { icon: '📈', title: 'SLA & Métricas', desc: 'Reportes de cumplimiento de acuerdos de nivel de servicio por técnico.' },
        { icon: '👁️', title: 'Supervisión del Equipo', desc: 'Monitorea el rendimiento individual de cada miembro del equipo.' },
      ],
      Coordinador: [
        { icon: '🎯', title: 'Asignación Inteligente', desc: 'Asigna tickets a los técnicos adecuados de tu área.' },
        { icon: '📊', title: 'SLA & Métricas', desc: 'Reportes detallados de rendimiento y cumplimiento por técnico.' },
        { icon: '📝', title: 'Mis Solicitudes', desc: 'Envía solicitudes personales a DTI o CAM cuando lo necesites.' },
      ],
      Asistencia: [
        { icon: '🔧', title: 'Tickets Asignados', desc: 'Gestiona y resuelve todos los tickets que te son asignados.' },
        { icon: '⏱️', title: 'SLA Personal', desc: 'Monitorea tu cumplimiento de plazos y mantén un alto rendimiento.' },
        { icon: '📝', title: 'Mis Solicitudes', desc: 'Envía solicitudes personales a otras áreas cuando lo necesites.' },
      ],
      Empleado: [
        { icon: '📬', title: 'Crear Solicitudes', desc: 'Envía solicitudes de soporte a DTI (tecnología) y CAM (comunicaciones).' },
        { icon: '🔍', title: 'Seguimiento en Tiempo Real', desc: 'Consulta el estado de tus solicitudes y recibe actualizaciones al instante.' },
        { icon: '🔔', title: 'Notificaciones por Email', desc: 'Recibirás correos automáticos cuando tu solicitud avance o se resuelva.' },
      ],
    }
    const roleFeatures = features[role] ?? features['Empleado']

    const featuresHtml = roleFeatures.map((f) => `
      <td width="33%" style="padding:0 8px 0 0;vertical-align:top;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#f8faff;border:1px solid #e0e7ff;border-radius:12px;padding:20px 16px;text-align:center;">
              <div style="font-size:28px;line-height:1;margin-bottom:10px;">${f.icon}</div>
              <div style="font-size:13px;font-weight:700;color:#1e1b4b;margin-bottom:6px;">${f.title}</div>
              <div style="font-size:12px;color:#6b7280;line-height:1.5;">${f.desc}</div>
            </td>
          </tr>
        </table>
      </td>
    `).join('')

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Tu invitación a AXIS</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- ═══ HEADER ═══ -->
        <tr>
          <td style="background:linear-gradient(145deg,#0f0c29 0%,#302b63 50%,#24243e 100%);border-radius:20px 20px 0 0;padding:44px 40px 36px;text-align:center;">

            <!-- Logo mark -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>
                <td style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:14px;width:56px;height:56px;text-align:center;vertical-align:middle;">
                  <span style="font-size:26px;line-height:56px;">⚡</span>
                </td>
                <td style="width:14px;"></td>
                <td style="vertical-align:middle;text-align:left;">
                  <div style="font-size:30px;font-weight:900;color:#ffffff;letter-spacing:-1.5px;line-height:1;">AXIS</div>
                  <div style="font-size:10px;font-weight:600;color:#818cf8;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">Gestión Integrada</div>
                </td>
              </tr>
            </table>

            <!-- Badge -->
            <div style="margin-bottom:20px;">
              <span style="display:inline-block;padding:5px 16px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;${badgeStyle}">${roleLabel}${area ? ' · ' + area : ''}</span>
            </div>

            <!-- Headline -->
            <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#ffffff;line-height:1.25;">¡Bienvenido a AXIS,<br><span style="color:#a5b4fc;">${userName}</span>!</h1>
            <p style="margin:0;font-size:15px;color:#c7d2fe;line-height:1.6;">Has sido invitado como <strong style="color:#e0e7ff;">${roleLabel}</strong>${areaLine}.<br>Tu acceso está listo para usar.</p>

          </td>
        </tr>

        <!-- ═══ DIVIDER WITH ICON ═══ -->
        <tr>
          <td style="background:linear-gradient(180deg,#302b63,#ffffff);padding:0;height:32px;"></td>
        </tr>

        <!-- ═══ BODY ═══ -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px 0;">

            <!-- Greeting -->
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
              Tu cuenta ha sido creada en <strong>AXIS</strong>, la plataforma integrada de gestión de solicitudes de <strong>DTI</strong> y <strong>CAM</strong>. Con tu perfil de <strong>${roleLabel}</strong> tienes acceso inmediato a las herramientas de tu rol.
            </p>

            <!-- Access info box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:32px;vertical-align:top;">
                        <span style="font-size:20px;">🔑</span>
                      </td>
                      <td style="padding-left:12px;vertical-align:top;">
                        <div style="font-size:13px;font-weight:700;color:#0369a1;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Tus datos de acceso</div>
                        <div style="font-size:14px;color:#0c4a6e;margin-bottom:4px;"><strong>Email:</strong> ${userEmail}</div>
                        <div style="font-size:13px;color:#0369a1;margin-top:8px;">Ingresa a la plataforma y solicita un <strong>código OTP</strong> a tu correo para autenticarte. No necesitas contraseña.</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Features section -->
            <div style="margin-bottom:8px;">
              <div style="font-size:11px;font-weight:700;color:#6366f1;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">✦ Lo que puedes hacer en AXIS</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>${featuresHtml}</tr>
              </table>
            </div>

          </td>
        </tr>

        <!-- ═══ CTA ═══ -->
        <tr>
          <td style="background:#ffffff;padding:32px 40px 36px;text-align:center;">
            <a href="${APP_URL}"
               style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.3px;box-shadow:0 4px 15px rgba(99,102,241,0.4);">
              ⚡ &nbsp; Ingresar a AXIS
            </a>
            <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">O copia y pega este enlace en tu navegador:<br><a href="${APP_URL}" style="color:#6366f1;text-decoration:none;">${APP_URL}</a></p>
          </td>
        </tr>

        <!-- ═══ STEPS ═══ -->
        <tr>
          <td style="background:#fafafa;border-top:1px solid #f3f4f6;padding:28px 40px;">
            <div style="font-size:11px;font-weight:700;color:#6366f1;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">✦ Cómo acceder</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${[
                ['1', 'Haz clic en el botón <strong>Ingresar a AXIS</strong>'],
                ['2', 'Ingresa tu correo: <strong>' + userEmail + '</strong>'],
                ['3', 'Haz clic en <strong>Enviar código</strong> para recibir un OTP'],
                ['4', 'Ingresa el código de 6 dígitos que llegará a tu correo'],
                ['5', '¡Listo! Ya estás dentro de AXIS 🎉'],
              ].map(([n, text]) => `
              <tr>
                <td style="padding:6px 0;vertical-align:top;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:28px;height:28px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:50%;text-align:center;vertical-align:middle;font-size:12px;font-weight:800;color:#fff;">${n}</td>
                      <td style="padding-left:12px;font-size:13px;color:#374151;line-height:1.5;">${text}</td>
                    </tr>
                  </table>
                </td>
              </tr>`).join('')}
            </table>
          </td>
        </tr>

        <!-- ═══ FOOTER ═══ -->
        <tr>
          <td style="background:#1e1b4b;border-radius:0 0 20px 20px;padding:28px 40px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
              <tr>
                <td style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                  <span style="font-size:16px;line-height:32px;">⚡</span>
                </td>
                <td style="width:8px;"></td>
                <td style="font-size:18px;font-weight:900;color:#fff;letter-spacing:-1px;vertical-align:middle;">AXIS</td>
              </tr>
            </table>
            <p style="margin:0 0 6px;font-size:12px;color:#818cf8;">Sistema Integrado DTI + CAM &nbsp;·&nbsp; Emprende Tu Carrera</p>
            <p style="margin:0;font-size:11px;color:#4338ca;">Este es un correo automático. Si no esperabas esta invitación, ignóralo o contacta a tu administrador.</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`

    return this.sendEmail({
      to: userEmail,
      subject: `⚡ Tu acceso a AXIS está listo, ${userName}`,
      html,
      text: `Bienvenido a AXIS, ${userName}. Tu cuenta como ${roleLabel}${area ? ` en ${area}` : ''} ha sido creada. Ingresa en: ${APP_URL}`,
    })
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    return this.sendInvitationEmail(userEmail, userName, 'Empleado', null)
  }

  /**
   * Envía un código de verificación OTP por email
   * @param userEmail Email del usuario
   * @param code Código OTP de 6 dígitos
   * @returns true si se envió exitosamente, false en caso contrario
   */
  async sendVerificationCode(userEmail: string, code: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .code-box { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px dashed #10b981; }
            .code { font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Código de Verificación</h1>
            </div>
            <div class="content">
              <p>Hola,</p>
              <p>Has solicitado iniciar sesión en <strong>FixIT</strong>. Utiliza el siguiente código para completar tu inicio de sesión:</p>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Tu código de verificación es:</p>
                <div class="code">${code}</div>
              </div>
              
              <div class="warning">
                <p style="margin: 0;"><strong>⚠️ Importante:</strong></p>
                <ul style="margin: 10px 0 0 20px; padding: 0;">
                  <li>Este código expira en 10 minutos</li>
                  <li>No compartas este código con nadie</li>
                  <li>Si no solicitaste este código, ignora este email</li>
                </ul>
              </div>
              
              <p>Si no solicitaste este código, puedes ignorar este mensaje de forma segura.</p>
            </div>
            <div class="footer">
              <p>Este es un mensaje automático del sistema FixIT</p>
              <p>Por seguridad, nunca compartiremos tu código de verificación por otros medios.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `Código de verificación FixIT\n\nTu código de verificación es: ${code}\n\nEste código expira en 10 minutos. Si no solicitaste este código, ignora este mensaje.`

    return await this.sendEmail({
      to: userEmail,
      subject: '[FixIT] Código de Verificación para Inicio de Sesión',
      html,
      text,
    })
  }
}

export const emailService = new EmailService()
