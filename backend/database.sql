-- =========================================================
--  ColdPress Coffee — Banner CMS schema (MySQL 8)
--  Open in MySQL Workbench and run the whole script (⚡),
--  or:  mysql -u root -p < database.sql
-- =========================================================

CREATE DATABASE IF NOT EXISTS coldpress_banner
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE coldpress_banner;

-- ---------- Admin users ----------
CREATE TABLE IF NOT EXISTS admins (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(60)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- Global banner + navbar settings (key/value) ----------
CREATE TABLE IF NOT EXISTS settings (
  setting_key   VARCHAR(80) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- Navbar links ----------
CREATE TABLE IF NOT EXISTS nav_links (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  label      VARCHAR(60)  NOT NULL,
  url        VARCHAR(255) NOT NULL DEFAULT '#',
  sort_order INT NOT NULL DEFAULT 0,
  is_active  TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ---------- Flavors (each one is a banner "slide": 3D bottle colour + copy) ----------
CREATE TABLE IF NOT EXISTS flavors (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(60)  NOT NULL,
  subtitle     VARCHAR(120) NOT NULL DEFAULT '',
  headline     VARCHAR(160) NOT NULL,
  description  TEXT NOT NULL,
  price        DECIMAL(8,2) NOT NULL DEFAULT 0,
  volume       VARCHAR(30)  NOT NULL DEFAULT '250 ml',
  caffeine     VARCHAR(30)  NOT NULL DEFAULT '180 mg',
  liquid_color VARCHAR(7)   NOT NULL DEFAULT '#3b1f12',
  label_color  VARCHAR(7)   NOT NULL DEFAULT '#f3e6d3',
  accent_color VARCHAR(7)   NOT NULL DEFAULT '#c8894b',
  bg_color     VARCHAR(7)   NOT NULL DEFAULT '#140c08',
  sort_order   INT NOT NULL DEFAULT 0,
  is_active    TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ---------- Small stat chips in the banner ----------
CREATE TABLE IF NOT EXISTS banner_stats (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  value      VARCHAR(30) NOT NULL,
  label      VARCHAR(60) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active  TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ---------- In-banner process animation steps (bean -> powder -> cold press -> bottle -> pour -> hot milk) ----------
-- scene_key is fixed (it drives the 3D scene); everything else is editable.
CREATE TABLE IF NOT EXISTS process_steps (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  scene_key    ENUM('beans','grind','brew','bottle','serve','milk') NOT NULL UNIQUE,
  step_label   VARCHAR(40)  NOT NULL,
  title        VARCHAR(120) NOT NULL,
  description  TEXT NOT NULL,
  duration_sec DECIMAL(4,1) NOT NULL DEFAULT 3.0,
  bg_color     VARCHAR(7)   NOT NULL DEFAULT '#140c08',
  sort_order   INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- ---------- User interaction: pre-order sign-ups from the banner ----------
CREATE TABLE IF NOT EXISTS preorders (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(190) NOT NULL,
  flavor_id  INT NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_email_flavor (email, flavor_id),
  CONSTRAINT fk_preorder_flavor FOREIGN KEY (flavor_id)
    REFERENCES flavors(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
--  Seed data
-- =========================================================

-- Default admin:  admin / admin123   (change it after first login!)
INSERT IGNORE INTO admins (username, password_hash) VALUES
('admin', '$2y$10$CNxdz1fKy29Ditr2gSw7Y.px8vxjKWr0/n0q9fXc/vWBuIoKIql4q');

INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
('brand_name',        'COLDPRESS'),
('brand_tagline',     'Slow Brew Co.'),
('nav_cta_text',      'Shop Now'),
('nav_cta_url',       '#shop'),
('eyebrow',           'Steeped 18 hours · Finished with hot milk'),
('primary_cta_text',  'Pre-order'),
('secondary_cta_text','Watch the brew'),
('secondary_cta_url', '#story'),
('form_placeholder',  'Enter your email'),
('form_success_text', 'You are on the list. First batch ships Friday.'),
('scroll_hint',       'Scroll to explore');

INSERT INTO nav_links (label, url, sort_order)
SELECT * FROM (SELECT 'Home' AS l, '#' AS u, 1 AS s UNION ALL
               SELECT 'Shop', '#shop', 2 UNION ALL
               SELECT 'Our Brew', '#story', 3 UNION ALL
               SELECT 'Subscribe', '#subscribe', 4 UNION ALL
               SELECT 'Contact', '#contact', 5) t
WHERE NOT EXISTS (SELECT 1 FROM nav_links);

INSERT INTO flavors (name, subtitle, headline, description, price, volume, caffeine,
                     liquid_color, label_color, accent_color, bg_color, sort_order)
SELECT * FROM (
  SELECT 'Original Black' AS n, 'Single-origin Ethiopia' AS st,
         'Cold. Pressed. Perfected.' AS h,
         'Ethically sourced beans, steeped for 18 hours in cold mountain water. Smooth, low-acid and bold enough to wake the city.' AS d,
         4.99 AS p, '250 ml' AS v, '210 mg' AS c,
         '#2a1408' AS lc, '#f1e4d1' AS lbc, '#d39a5c' AS ac, '#3a2414' AS bg, 1 AS so
  UNION ALL
  SELECT 'Vanilla Oat', 'Madagascar vanilla · oat milk',
         'Velvet in every sip.',
         'Our signature cold brew folded with creamy oat milk and real Madagascar vanilla bean. Dairy-free, naturally sweet.',
         5.49, '250 ml', '150 mg',
         '#a5754d', '#fbf3e6', '#e9c58f', '#463021', 2
  UNION ALL
  SELECT 'Salted Caramel', 'Sea salt · burnt sugar',
         'Sweet meets the deep.',
         'Slow-cooked caramel and a pinch of sea salt over a dark-roast cold brew base. Dessert energy, zero compromise.',
         5.49, '250 ml', '170 mg',
         '#7a3f17', '#f6dcc0', '#f08a3c', '#45291a', 3
  UNION ALL
  SELECT 'Mocha Noir', '70% dark cacao',
         'Dark side of the bean.',
         'Cold brew meets 70% single-estate cacao for a deep, chocolatey finish with a clean, energising kick.',
         5.99, '250 ml', '190 mg',
         '#3d1d14', '#ead2c4', '#c0664a', '#3a201a', 4
) t
WHERE NOT EXISTS (SELECT 1 FROM flavors);

INSERT INTO banner_stats (value, label, sort_order)
SELECT * FROM (SELECT '18h' AS v, 'Cold steeped' AS l, 1 AS s UNION ALL
               SELECT '0g', 'Added sugar', 2 UNION ALL
               SELECT '100%', 'Arabica beans', 3) t
WHERE NOT EXISTS (SELECT 1 FROM banner_stats);

INSERT IGNORE INTO process_steps (scene_key, step_label, title, description, duration_sec, bg_color, sort_order) VALUES
('beans',  'Seeds', 'Roasted coffee seeds',   'Specialty arabica seeds, hand-picked and slow roasted in small batches.', 3.8, '#3a2414', 1),
('grind',  'Powder',   'Seeds into powder', 'A slow burr grind turns the roasted seeds into fresh, coarse coffee powder.',               4.0, '#432817', 2),
('brew',   'Decoction',   'Cold water decoction',  'Cold water soaks the powder for 18 hours and slowly turns into a rich coffee decoction.',              3.2, '#3d2516', 3),
('bottle', 'Press',  'Cold pressed',    'The plunger presses the powder down, leaving only smooth, clear decoction.',                    3.4, '#3a2414', 4),
('serve',  'Pour',     'Into the cup',     'The cold-pressed decoction pours straight from the bottle into the glass.',         4.2, '#3f2716', 5),
('milk',   'Hot milk', 'Hot milk, stirred in', 'Steaming hot milk is poured into the cold-pressed coffee and stirred into a creamy cappuccino.', 6.5, '#46301f', 6);
