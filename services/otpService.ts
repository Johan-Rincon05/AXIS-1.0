import { query, queryOne } from '@/lib/db/client'

const OTP_EXPIRATION_MINUTES = 10
const MAX_ATTEMPTS = 5

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function generateOTPCode(email: string): Promise<string> {
  const code = generateOTP()
  const emailNorm = email.toLowerCase()

  // Invalidar códigos anteriores para este email
  await query(
    `UPDATE otp_codes SET used = TRUE WHERE email = $1 AND used = FALSE`,
    [emailNorm]
  )

  // Insertar nuevo código con expiración
  await query(
    `INSERT INTO otp_codes (email, code, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '${OTP_EXPIRATION_MINUTES} minutes')`,
    [emailNorm, code]
  )

  // Limpiar registros expirados o usados (mantenimiento)
  await query(`SELECT cleanup_expired_otps()`).catch(() => {})

  return code
}

export async function verifyOTPCode(email: string, code: string): Promise<boolean> {
  const emailNorm = email.toLowerCase()

  const otp = await queryOne<{
    id: string
    code: string
    attempts: number
    expires_at: Date
  }>(
    `SELECT id, code, attempts, expires_at
     FROM otp_codes
     WHERE email = $1 AND used = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [emailNorm]
  )

  if (!otp) return false

  if (otp.attempts >= MAX_ATTEMPTS) {
    await query(`UPDATE otp_codes SET used = TRUE WHERE id = $1`, [otp.id])
    return false
  }

  if (otp.code === code) {
    await query(`UPDATE otp_codes SET used = TRUE WHERE id = $1`, [otp.id])
    return true
  }

  // Código incorrecto — incrementar intentos
  await query(
    `UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`,
    [otp.id]
  )
  return false
}

export async function invalidateOTPCode(email: string): Promise<void> {
  await query(
    `UPDATE otp_codes SET used = TRUE WHERE email = $1 AND used = FALSE`,
    [email.toLowerCase()]
  )
}
