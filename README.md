# ColdPress — 3D Cold Brew Banner (concept)

A single hero banner (navbar + banner only) for a premium cold-press coffee brand.
It opens with a **brand intro** (bean logo draws itself, brand name rises letter by letter, the screen splits open),
then a 3D animation plays **inside the banner**, in 6 timed steps:

1. **Seeds** – roasted coffee seeds fall in and swirl
2. **Powder** – a burr grinder turns the seeds into coffee powder
3. **Decoction** – cold water pours in, the powder settles and the water darkens into decoction
4. **Press** – a plunger cold-presses the powder down, the cap drops on, the label wraps around
5. **Pour** – ice drops into a glass coffee mug, the bottle tilts and pours the decoction, then leaves
6. **Milk** – white milk pours in and a straw stirs it until it turns a creamy coffee colour

It ends on the coffee cup as the hero, with flavor switcher, price and a pre-order form.
Every text in the banner is animated (letter-by-letter headlines, word fades, scramble/decode labels, count-up numbers).
All text, colors, flavors, step titles and **step timings** come from MySQL and are edited in the PHP admin panel.

| Part | Tech |
|---|---|
| Frontend | Next.js 15 (React 19) |
| 3D | Three.js + React Three Fiber + drei (all models built in code, no downloads) |
| Animation | GSAP (master timeline, text effects, magnetic buttons) |
| Backend | PHP 8 (plain PDO) |
| Database | MySQL 8 (Workbench) |

```
backend/            PHP API + admin panel
  database.sql      schema + seed data (run once in MySQL Workbench)
  config.php        defaults; real password goes in config.local.php
  api/banner.php    GET  – all banner content as JSON
  api/preorder.php  POST – saves an email from the banner form
  admin/            admin panel (login, CRUD for every banner section)
frontend/           Next.js app
  components/Banner.jsx         banner UI + GSAP timeline
  components/AnimatedText.jsx   letter/word/scramble/count-up text effects
  components/scene/*            3D scene (beans, grinder, powder, bottle, glass, splash)
```

## Run locally

Requirements: Node.js 18+, PHP 8.1+ (XAMPP's PHP is fine), MySQL 8.

### 1. Database (one time)

Open `backend/database.sql` in MySQL Workbench and run it, or from a terminal:

```bash
mysql -u root -p --default-character-set=utf8mb4 < backend/database.sql
```

Then copy `backend/config.local.example.php` to `backend/config.local.php` and put your MySQL password in it.

### 2. Start the PHP backend (terminal 1)

```bash
cd backend
php -S 127.0.0.1:8000 -t .
```

### 3. Start the frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

### 4. Open

- Banner: http://localhost:3000
- Admin panel: http://localhost:8000/admin — login `admin` / `admin123` (change it under **Account**)

Tip: `http://localhost:3000/?at=4.5` freezes the animation at any point (0–6) — handy when tweaking.

If the PHP server is not running, the banner still works with built-in demo content and shows a small "PHP API offline" badge.

## Admin panel sections

- **Banner & Navbar Text** – brand name, tagline, button texts/links, form texts
- **Navbar Links** – add / reorder / hide links
- **Flavors (3D bottle)** – name, headline, description, price, and the liquid, label, accent and background colors used by the 3D scene
- **Stat Chips** – the small numbers under the form
- **Process Animation** – title, text, background color and **duration in seconds** of each of the 6 steps
- **Pre-order Sign-ups** – emails submitted from the banner, with CSV export

## Deploy on Render — ONE web service for the site, admin and API

One Docker container (root `Dockerfile`) runs both parts. Next.js listens on Render's port and
forwards `/admin` and `/api` to PHP, which runs privately inside the container:

| URL | What |
|---|---|
| `https://<app>.onrender.com/` | the 3D banner |
| `https://<app>.onrender.com/admin` | admin panel |
| `https://<app>.onrender.com/api/banner.php` | API |

Local development is unchanged (MySQL, PHP on :8000, Next.js on :3000 — `localhost:3000/admin` works too).
On Render the backend uses Neon PostgreSQL because `DATABASE_URL` is set.

### 1. Copy / refresh the data in Neon (already done once)
```bash
cd backend
DATABASE_URL="postgresql://…your Neon string…" php -d extension=pdo_pgsql tools/migrate_mysql_to_pg.php
```
Reads local MySQL only, creates the tables in Neon (`database.pg.sql`) and replaces their rows. Safe to re-run.

### 2. Create the web service
Render → **New → Web Service** → connect this GitHub repo
- Branch: `main` · Root Directory: *(leave empty)* · Language: **Docker** (uses the root `Dockerfile`)
- Environment variable: `DATABASE_URL` = your Neon connection string
- Create → wait for the build (5–10 min the first time) → open the URL; admin at `/admin`
