-- =========================================================
--  ColdPress Coffee — Banner CMS schema for PostgreSQL (Neon)
--  Same tables as database.sql (MySQL). Data is copied with:
--    php -d extension=pdo_pgsql tools/migrate_mysql_to_pg.php
-- =========================================================

CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(60)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  setting_key   VARCHAR(80) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nav_links (
  id         SERIAL PRIMARY KEY,
  label      VARCHAR(60)  NOT NULL,
  url        VARCHAR(255) NOT NULL DEFAULT '#',
  sort_order INT NOT NULL DEFAULT 0,
  is_active  SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS flavors (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(60)  NOT NULL,
  subtitle     VARCHAR(120) NOT NULL DEFAULT '',
  headline     VARCHAR(160) NOT NULL,
  description  TEXT NOT NULL,
  price        NUMERIC(8,2) NOT NULL DEFAULT 0,
  volume       VARCHAR(30)  NOT NULL DEFAULT '250 ml',
  caffeine     VARCHAR(30)  NOT NULL DEFAULT '180 mg',
  liquid_color VARCHAR(7)   NOT NULL DEFAULT '#3b1f12',
  label_color  VARCHAR(7)   NOT NULL DEFAULT '#f3e6d3',
  accent_color VARCHAR(7)   NOT NULL DEFAULT '#c8894b',
  bg_color     VARCHAR(7)   NOT NULL DEFAULT '#3a2414',
  sort_order   INT NOT NULL DEFAULT 0,
  is_active    SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS banner_stats (
  id         SERIAL PRIMARY KEY,
  value      VARCHAR(30) NOT NULL,
  label      VARCHAR(60) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active  SMALLINT NOT NULL DEFAULT 1
);

-- scene_key is fixed (it drives the 3D scene); everything else is editable
CREATE TABLE IF NOT EXISTS process_steps (
  id           SERIAL PRIMARY KEY,
  scene_key    VARCHAR(10) NOT NULL UNIQUE CHECK (scene_key IN ('beans','grind','brew','bottle','serve','milk')),
  step_label   VARCHAR(40)  NOT NULL,
  title        VARCHAR(120) NOT NULL,
  description  TEXT NOT NULL,
  duration_sec NUMERIC(4,1) NOT NULL DEFAULT 3.0,
  bg_color     VARCHAR(7)   NOT NULL DEFAULT '#3a2414',
  sort_order   INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS preorders (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(190) NOT NULL,
  flavor_id  INT NULL REFERENCES flavors(id) ON DELETE SET NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_email_flavor UNIQUE (email, flavor_id)
);
