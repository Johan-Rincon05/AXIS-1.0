-- =============================================================================
-- AXIS — Schema PostgreSQL
-- Sistema Integrado DTI + CAM
-- Compatible con PostgreSQL 14+ en Dokploy
-- =============================================================================

-- Extensión para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TIPOS ENUM
-- =============================================================================

CREATE TYPE user_role AS ENUM ('Empleado', 'Gerente', 'Coordinador', 'Asistencia');
CREATE TYPE user_area AS ENUM ('DTI', 'CAM');

CREATE TYPE ticket_status AS ENUM ('Abierto', 'En Progreso', 'Resuelto', 'Cerrado');
CREATE TYPE ticket_priority AS ENUM ('Alta', 'Media', 'Baja');
CREATE TYPE ticket_area AS ENUM ('DTI', 'CAM');
CREATE TYPE ticket_origin AS ENUM ('Interna', 'Externa');

CREATE TYPE tipo_solicitud_cam AS ENUM (
  'Diseño Gráfico',
  'Edición de Video',
  'Grabación Audiovisual',
  'Pauta/Publicidad',
  'Redes Sociales',
  'Otro'
);

CREATE TYPE activity_type AS ENUM (
  'comment',
  'assignment',
  'status_change',
  'creation',
  'transfer'
);

-- =============================================================================
-- TABLA: users
-- =============================================================================

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  phone       TEXT,
  role        user_role NOT NULL DEFAULT 'Empleado',
  area        user_area,
  avatar_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_role     ON users(role);
CREATE INDEX idx_users_area     ON users(area);
CREATE INDEX idx_users_active   ON users(is_active);

-- =============================================================================
-- TABLA: tickets
-- =============================================================================

CREATE TABLE tickets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  status              ticket_status NOT NULL DEFAULT 'Abierto',
  priority            ticket_priority NOT NULL DEFAULT 'Media',
  category            TEXT NOT NULL DEFAULT 'Otro',
  area                ticket_area NOT NULL,

  -- Relaciones de usuarios
  created_by          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_to         UUID REFERENCES users(id) ON DELETE SET NULL,
  transferred_by      UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Campos DTI
  origin              ticket_origin DEFAULT 'Interna',
  external_company    TEXT,
  external_contact    TEXT,

  -- Campos CAM
  tipo_solicitud      tipo_solicitud_cam,
  objetivo_solicitud  TEXT,
  publico_objetivo    TEXT,
  mensaje_clave       TEXT,
  fecha_limite        DATE,

  -- Resolución
  resolution_notes    TEXT,
  resolved_at         TIMESTAMPTZ,

  -- Metadatos
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_area        ON tickets(area);
CREATE INDEX idx_tickets_status      ON tickets(status);
CREATE INDEX idx_tickets_priority    ON tickets(priority);
CREATE INDEX idx_tickets_created_by  ON tickets(created_by);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_created_at  ON tickets(created_at DESC);

-- =============================================================================
-- TABLA: comments
-- =============================================================================

CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_ticket_id ON comments(ticket_id);
CREATE INDEX idx_comments_user_id   ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at ASC);

-- =============================================================================
-- TABLA: attachments
-- =============================================================================

CREATE TABLE attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id     UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  uploaded_by   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  filename      TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_size     BIGINT NOT NULL,
  mime_type     TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attachments_ticket_id ON attachments(ticket_id);

-- =============================================================================
-- TABLA: activity_log
-- =============================================================================

CREATE TABLE activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        activity_type NOT NULL,
  description TEXT NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_ticket_id  ON activity_log(ticket_id);
CREATE INDEX idx_activity_user_id    ON activity_log(user_id);
CREATE INDEX idx_activity_type       ON activity_log(type);
CREATE INDEX idx_activity_created_at ON activity_log(created_at ASC);

-- =============================================================================
-- TABLA: otp_codes
-- OTP almacenado en BD (en lugar de memoria, para ser stateless en Vercel)
-- =============================================================================

CREATE TABLE otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  code        TEXT NOT NULL,
  attempts    SMALLINT NOT NULL DEFAULT 0,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_email      ON otp_codes(email);
CREATE INDEX idx_otp_expires_at ON otp_codes(expires_at);

-- =============================================================================
-- FUNCIÓN: updated_at automático
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- FUNCIÓN: limpiar OTPs expirados
-- =============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_codes WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DATOS INICIALES (seed)
-- =============================================================================

-- Usuario administrador por defecto (ajustar email antes de ejecutar)
INSERT INTO users (id, name, email, role, area, is_active)
VALUES
  (gen_random_uuid(), 'Administrador Sistema', 'admin@emprendetucarrera.com.co', 'Gerente', 'DTI', TRUE)
ON CONFLICT (email) DO NOTHING;
