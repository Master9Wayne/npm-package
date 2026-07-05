# NPM — NITK Package Manager
## Complete Setup Guide

This guide covers every service, configuration, and command needed to get both the backend and frontend running with a single `npm run dev` each.

---

## Table of Contents

1. [Prerequisites — Software to Install](#1-prerequisites--software-to-install)
2. [External Services to Set Up](#2-external-services-to-set-up)
   - 2.1 [MySQL Database](#21-mysql-database)
   - 2.2 [Twilio (SMS & OTP)](#22-twilio-sms--otp)
3. [Project Folder Structure](#3-project-folder-structure)
4. [Backend Setup (Step by Step)](#4-backend-setup-step-by-step)
   - 4.1 [Install dependencies](#41-install-dependencies)
   - 4.2 [Configure environment variables](#42-configure-environment-variables)
   - 4.3 [Create the MySQL database](#43-create-the-mysql-database)
   - 4.4 [Run Prisma migrations (creates all tables)](#44-run-prisma-migrations-creates-all-tables)
   - 4.5 [Seed required initial data](#45-seed-required-initial-data)
   - 4.6 [Start the backend](#46-start-the-backend)
5. [Frontend Setup (Step by Step)](#5-frontend-setup-step-by-step)
   - 5.1 [Install dependencies](#51-install-dependencies)
   - 5.2 [Configure environment variables](#52-configure-environment-variables)
   - 5.3 [Start the frontend](#53-start-the-frontend)
6. [Database Tables Reference](#6-database-tables-reference)
7. [What Each Table Is Used For](#7-what-each-table-is-used-for)
8. [Environment Variables Reference](#8-environment-variables-reference)
9. [Verification Checklist](#9-verification-checklist)
10. [Common Errors and Fixes](#10-common-errors-and-fixes)

---

## 1. Prerequisites — Software to Install

Install all of these before doing anything else.

### Node.js (v18 or higher)
The backend and frontend both run on Node.js.

- Download from: https://nodejs.org/en/download
- Choose the **LTS** version (currently v20.x)
- After installing, verify:
  ```bash
  node --version   # should print v18.x.x or higher
  npm --version    # should print 9.x or higher
  ```

### MySQL (v8.0 or higher)
The database that stores all application data.

**On Windows:**
- Download MySQL Installer from: https://dev.mysql.com/downloads/installer/
- Run the installer, choose "Developer Default"
- During setup, set a root password — **remember this password**, you will need it

**On macOS:**
```bash
# Using Homebrew (install Homebrew first from https://brew.sh)
brew install mysql
brew services start mysql
mysql_secure_installation   # follow prompts, set root password
```

**On Ubuntu/Debian Linux:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation   # set root password when prompted
```

After installing, verify:
```bash
mysql --version   # should print 8.0.x or higher
```

### Git (optional, for cloning)
- Download from: https://git-scm.com/downloads

---

## 2. External Services to Set Up

### 2.1 MySQL Database

MySQL is installed locally (no cloud account needed). You only need to create one empty database and a user for the app.

**Step 1 — Log into MySQL as root:**
```bash
mysql -u root -p
# Enter your root password when prompted
```

**Step 2 — Create the database and a dedicated user:**
```sql
-- Create the database
CREATE DATABASE npm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (safer than using root)
CREATE USER 'npm_user'@'localhost' IDENTIFIED BY 'npm_password123';

-- Grant all permissions on the npm_db database to this user
GRANT ALL PRIVILEGES ON npm_db.* TO 'npm_user'@'localhost';

-- Apply the changes
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

> **Note:** You can use any username and password you like. Just make sure they match what you put in the `.env` file later. If you prefer to just use root, that works too — just replace `npm_user` and `npm_password123` with `root` and your root password in the `.env`.

**Verify the database was created:**
```bash
mysql -u npm_user -p
# Enter npm_password123
SHOW DATABASES;   # npm_db should appear in the list
EXIT;
```

> You do NOT need to create any tables manually. Prisma will create all 9 tables automatically when you run `npx prisma migrate dev` in step 4.4.

---

### 2.2 Twilio (SMS & OTP)

Twilio is used to send OTP verification SMS messages to students who haven't logged in for 30+ days. In development mode, OTPs are printed to the terminal console — a real Twilio account is not required to test the application locally.

#### Option A — Development Mode (No Twilio Account Needed)

The backend is already coded to skip real SMS when `NODE_ENV=development`. OTPs are printed to the backend terminal like this:
```
[DEV] OTP for +919876543210: 482910
```

To use this mode, set in your `.env`:
```
NODE_ENV=development
```
Leave the Twilio variables as placeholder strings — they won't be called.

#### Option B — Real Twilio Account (for production or real SMS testing)

If actual SMS delivery is required:

**Step 1 — Create a free Twilio account:**
- Go to: https://www.twilio.com/try-twilio
- Sign up with your email
- Verify your email and phone number

**Step 2 — Get your credentials:**
- After signing in, go to the **Console Dashboard**: https://console.twilio.com
- You will see:
  - **Account SID** — looks like `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
  - **Auth Token** — looks like `your_auth_token` (click the eye icon to reveal)
- Copy both of these

**Step 3 — Get a Twilio phone number:**
- In the console, click **Phone Numbers → Manage → Buy a Number**
- Choose a number with SMS capability
- Free trial accounts get one number for free
- The number looks like `+14155552671`

**Step 4 — (Free trial only) Verify recipient numbers:**
- Free trial Twilio accounts can only send SMS to **verified** phone numbers
- Go to: **Verified Caller IDs** in the console
- Add the phone numbers of students you want to test with
- Each number gets a verification call/SMS

**Step 5 — Put the credentials in your `.env`:**
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+14155552671
NODE_ENV=production
```

---

## 3. Project Folder Structure

After extracting the zip, you will have:

```
npm-project/
│
├── README.md                          ← This file
│
├── backend/
│   ├── package.json
│   ├── .env.example                   ← Copy this to .env and fill it in
│   ├── .gitignore
│   ├── prisma/
│   │   └── schema.prisma              ← Database schema (all 9 tables defined here)
│   └── src/
│       ├── server.js                  ← App entry point
│       ├── config/
│       │   └── db.config.js           ← Prisma client setup
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── package.controller.js
│       │   ├── friend.controller.js
│       │   ├── pickup.controller.js
│       │   ├── notification.controller.js
│       │   ├── student.controller.js
│       │   ├── admin.controller.js
│       │   └── community.controller.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── package.routes.js
│       │   ├── friend.routes.js
│       │   ├── pickup.routes.js
│       │   ├── notification.routes.js
│       │   ├── student.routes.js
│       │   ├── admin.routes.js
│       │   └── community.routes.js
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   └── validate.middleware.js
│       └── utils/
│           ├── twilio.utils.js
│           ├── otp.utils.js
│           ├── notification.utils.js
│           └── cron.utils.js
│
└── frontend/
    ├── package.json
    ├── .env.example                   ← Copy this to .env and fill it in
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── index.css
        ├── App.js                     ← All routes defined here
        ├── hooks/
        │   ├── useAuth.js             ← Auth context (login/logout/user state)
        │   └── useTheme.js            ← Dark/light mode context
        ├── lib/
        │   ├── api.js                 ← All API calls (axios client)
        │   └── utils.js              ← Formatting helpers
        ├── components/
        │   └── layout/
        │       ├── StudentLayout.js   ← Student sidebar + mobile nav
        │       └── AdminLayout.js     ← Admin dark sidebar
        └── pages/
            ├── LandingPage.js
            ├── AuthPage.js
            ├── student/
            │   ├── StudentDashboardPage.js
            │   ├── PackagesPage.js
            │   ├── PackageDetailPage.js
            │   ├── FriendsPage.js
            │   ├── NotificationsPage.js
            │   └── CommunityPage.js
            └── admin/
                ├── AdminDashboardPage.js
                ├── AdminPackagesPage.js
                └── AdminLogPackagePage.js
```

---

## 4. Backend Setup (Step by Step)

### 4.1 Install Dependencies

```bash
cd npm-project/backend
npm install
```

This installs everything listed in `package.json`:

| Package | Purpose |
|---|---|
| `express` | HTTP server and routing |
| `@prisma/client` | Database ORM — talks to MySQL |
| `prisma` (dev) | CLI tool to run migrations |
| `bcryptjs` | Hashing passwords before storing them |
| `jsonwebtoken` | Creating and verifying JWT auth tokens |
| `cors` | Allows the React frontend (port 3000) to talk to the backend (port 5000) |
| `dotenv` | Reads variables from the `.env` file |
| `express-validator` | Validates incoming request data |
| `twilio` | Sends SMS messages |
| `node-cron` | Runs scheduled jobs (deadline checks every hour) |
| `uuid` | Generates unique package IDs like `PKG-A3F2BC1D` |
| `nodemon` (dev) | Auto-restarts the server when you edit files |

---

### 4.2 Configure Environment Variables

```bash
# From the backend/ directory
cp .env.example .env
```

Now open `.env` in a text editor and fill in every value:

```env
# The connection string for your MySQL database
# Format: mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
DATABASE_URL="mysql://npm_user:npm_password123@localhost:3306/npm_db"

# A long random secret used to sign JWT tokens
# Generate one by running: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET="paste_your_generated_secret_here"

# How long login tokens stay valid
JWT_EXPIRES_IN="7d"

# Port the backend server listens on
PORT=5000

# Twilio credentials (use placeholder strings if NODE_ENV=development)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="+14155552671"

# URL of the frontend (used for CORS)
FRONTEND_URL="http://localhost:3000"

# Set to "development" to skip real SMS and print OTPs to terminal instead
NODE_ENV=development

# How many minutes an OTP is valid before it expires
OTP_EXPIRY_MINUTES=10

# Default number of days a student has to collect a package
PICKUP_DEADLINE_DAYS=7
```

**Generating a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and paste it as your `JWT_SECRET`.

---

### 4.3 Create the MySQL Database

If step 2.1 has not already been completed, do it now. The `DATABASE_URL` in your `.env` must point to an existing database. Prisma will not create the database itself — only the tables inside it.

Verify your connection string works:
```bash
mysql -u npm_user -p npm_db
# Enter your password. If you get the mysql> prompt, it works.
EXIT;
```

---

### 4.4 Run Prisma Migrations (Creates All Tables)

This is the most important step. Prisma reads `prisma/schema.prisma` and creates all 9 tables in your MySQL database.

```bash
# From the backend/ directory
npx prisma migrate dev --name init
```

You will see output like:
```
Applying migration `20240101000000_init`
Database schema was successfully updated!
Generated Prisma Client
```

Then generate the Prisma client (needed for the app to query the database):
```bash
npx prisma generate
```

**To verify the tables were created:**
```bash
mysql -u npm_user -p npm_db
SHOW TABLES;
```

You should see all 9 tables:
```
+-----------------------------+
| Tables_in_npm_db            |
+-----------------------------+
| admins                      |
| community_groups            |
| ecommerce_platforms         |
| friendships                 |
| group_members               |
| hostels                     |
| notifications               |
| packages                    |
| pickup_auths                |
| students                    |
+-----------------------------+
```

---

### 4.5 Seed Required Initial Data

The application will not function without at least one hostel and one admin account. The student registration form also requires hostels to be present in the database.

**Open Prisma Studio (visual database editor):**
```bash
npx prisma studio
```
This opens a browser UI at `http://localhost:5555` where you can add rows to any table without writing SQL.

Or, if you prefer SQL, run the following directly in MySQL:

**Step 1 — Add Hostels:**
```sql
USE npm_db;

INSERT INTO hostels (name, address) VALUES
  ('Hostel 1', 'NITK Campus, Surathkal, Mangalore - 575025'),
  ('Hostel 2', 'NITK Campus, Surathkal, Mangalore - 575025'),
  ('Hostel 3', 'NITK Campus, Surathkal, Mangalore - 575025'),
  ('Hostel 4', 'NITK Campus, Surathkal, Mangalore - 575025'),
  ('Hostel 5', 'NITK Campus, Surathkal, Mangalore - 575025'),
  ('Hostel 6', 'NITK Campus, Surathkal, Mangalore - 575025'),
  ('Hostel 7', 'NITK Campus, Surathkal, Mangalore - 575025'),
  ('Hostel 8', 'NITK Campus, Surathkal, Mangalore - 575025'),
  ('Ladies Hostel', 'NITK Campus, Surathkal, Mangalore - 575025');
```

**Step 2 — Add E-commerce Platforms:**
```sql
INSERT INTO ecommerce_platforms (platform_id, name, location) VALUES
  ('AMAZON', 'Amazon India', 'Mangalore Fulfillment Center'),
  ('FLIPKART', 'Flipkart', 'Bangalore Fulfillment Center'),
  ('MEESHO', 'Meesho', 'Bangalore Warehouse'),
  ('MYNTRA', 'Myntra', 'Bangalore Warehouse'),
  ('AJIO', 'AJIO', 'Bangalore Warehouse'),
  ('NYKAA', 'Nykaa', 'Mumbai Warehouse'),
  ('SNAPDEAL', 'Snapdeal', 'Delhi Warehouse'),
  ('OTHER', 'Other / Unknown', 'Unknown');
```

**Step 3 — Add an Admin Account:**

First generate a bcrypt hash of your chosen admin password. Run this in a terminal:
```bash
node -e "const b = require('bcryptjs'); b.hash('admin123', 12).then(h => console.log(h));"
```
This prints a hash like: `$2a$12$abcdefghijklmnopqrstuuVwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`

Then insert the admin:
```sql
INSERT INTO admins (name, phone, password_hash) VALUES
  ('Hostel Admin', '+919876543210', '$2a$12$YOUR_HASH_HERE');
```

Replace `+919876543210` with the admin's phone number and paste your actual hash.

> **Admin login credentials after this:**
> - Phone: `+919876543210` (or whatever you used)
> - Password: `admin123` (or whatever you hashed)

---

### 4.6 Start the Backend

```bash
# From the backend/ directory
npm run dev
```

You should see:
```
Database connected successfully
[CRON] Jobs started
NPM Server running on port 5000
```

Test it is working:
```bash
curl http://localhost:5000/health
# Should return: {"status":"ok","timestamp":"..."}
```

---

## 5. Frontend Setup (Step by Step)

### 5.1 Install Dependencies

```bash
cd npm-project/frontend
npm install
```

This installs:

| Package | Purpose |
|---|---|
| `react`, `react-dom` | Core React library |
| `react-router-dom` | Client-side routing between pages |
| `axios` | Makes HTTP requests to the backend |
| `tailwindcss` | Utility CSS framework for all styling |
| `lucide-react` | Icon library used throughout the UI |
| `date-fns` | Date formatting (deadlines, timestamps) |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Utility helpers for conditional CSS classes |
| `@radix-ui/*` | Accessible UI primitives (dialogs, selects, tabs, etc.) |
| `tailwindcss-animate` | CSS animation utilities |

---

### 5.2 Configure Environment Variables

```bash
# From the frontend/ directory
cp .env.example .env
```

Open `.env` and set:

```env
# The full URL of your backend API
# This must match the PORT in backend/.env
REACT_APP_API_URL=http://localhost:5000/api
```

That is the only environment variable the frontend needs.

---

### 5.3 Start the Frontend

```bash
# From the frontend/ directory
npm start
```

You will see:
```
Compiled successfully!

You can now view npm-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

The browser will open `http://localhost:3000` automatically.

---

## 6. Database Tables Reference

All tables are created automatically by `npx prisma migrate dev`. Below is every table with its exact column definitions.

### `hostels`
Stores hostel buildings on campus.
```sql
CREATE TABLE hostels (
  hostel_id   INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  address     VARCHAR(255) NOT NULL
);
```

### `students`
Registered student accounts.
```sql
CREATE TABLE students (
  roll_no       VARCHAR(20)  PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  phone         VARCHAR(15)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  room_no       VARCHAR(10),
  hostel_id     INT,
  last_login    DATETIME,
  otp           VARCHAR(6),
  otp_expiry    DATETIME,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hostel_id) REFERENCES hostels(hostel_id)
);
```

### `admins`
Hostel staff who log package arrivals.
```sql
CREATE TABLE admins (
  admin_id      INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  phone         VARCHAR(15)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
);
```

### `ecommerce_platforms`
Known delivery platforms (Amazon, Flipkart, etc.).
```sql
CREATE TABLE ecommerce_platforms (
  platform_id VARCHAR(30)  PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  location    VARCHAR(255) NOT NULL
);
```

### `packages`
Every parcel logged by an admin.
```sql
CREATE TABLE packages (
  package_id       VARCHAR(50)  PRIMARY KEY,
  roll_no          VARCHAR(20)  NOT NULL,
  platform_id      VARCHAR(30),
  status           ENUM('PENDING','COLLECTED','OVERDUE','RETURNING','RETURNED') DEFAULT 'PENDING',
  arrival_datetime DATETIME     DEFAULT CURRENT_TIMESTAMP,
  pickup_deadline  DATETIME     NOT NULL,
  delivered_at     DATETIME,
  delivered_to     VARCHAR(20),
  logged_by_admin  INT,
  description      VARCHAR(255),
  created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (roll_no)         REFERENCES students(roll_no),
  FOREIGN KEY (platform_id)     REFERENCES ecommerce_platforms(platform_id),
  FOREIGN KEY (delivered_to)    REFERENCES students(roll_no),
  FOREIGN KEY (logged_by_admin) REFERENCES admins(admin_id)
);
```

### `friendships`
Friend requests between students in the same hostel.
```sql
CREATE TABLE friendships (
  friendship_id INT AUTO_INCREMENT PRIMARY KEY,
  requester_id  VARCHAR(20) NOT NULL,
  receiver_id   VARCHAR(20) NOT NULL,
  status        ENUM('PENDING','ACCEPTED','DECLINED') DEFAULT 'PENDING',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_friendship (requester_id, receiver_id),
  FOREIGN KEY (requester_id) REFERENCES students(roll_no),
  FOREIGN KEY (receiver_id)  REFERENCES students(roll_no)
);
```

### `pickup_auths`
Per-package authorizations allowing a friend to collect on behalf of the owner.
```sql
CREATE TABLE pickup_auths (
  auth_id       INT AUTO_INCREMENT PRIMARY KEY,
  package_id    VARCHAR(50) NOT NULL,
  authorized_by VARCHAR(20) NOT NULL,
  authorized_to VARCHAR(20) NOT NULL,
  status        ENUM('PENDING','ACCEPTED','DECLINED','EXPIRED','USED') DEFAULT 'PENDING',
  expires_at    DATETIME    NOT NULL,
  created_at    DATETIME    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (package_id)    REFERENCES packages(package_id),
  FOREIGN KEY (authorized_by) REFERENCES students(roll_no),
  FOREIGN KEY (authorized_to) REFERENCES students(roll_no)
);
```

### `notifications`
In-app notifications for students.
```sql
CREATE TABLE notifications (
  notif_id   INT AUTO_INCREMENT PRIMARY KEY,
  roll_no    VARCHAR(20)  NOT NULL,
  package_id VARCHAR(50),
  type       ENUM('ARRIVAL','DEADLINE_WARNING','PICKUP_AUTHORIZED','PICKUP_CONFIRMED','FRIEND_REQUEST','RETURNING') NOT NULL,
  message    VARCHAR(500) NOT NULL,
  is_read    BOOLEAN      DEFAULT FALSE,
  sent_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (roll_no)    REFERENCES students(roll_no),
  FOREIGN KEY (package_id) REFERENCES packages(package_id)
);
```

### `community_groups`
One group per hostel for community features.
```sql
CREATE TABLE community_groups (
  group_id   INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  hostel_id  INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### `group_members`
Students who have opted into community notifications.
```sql
CREATE TABLE group_members (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  group_id         INT         NOT NULL,
  roll_no          VARCHAR(20) NOT NULL,
  joined_at        DATETIME    DEFAULT CURRENT_TIMESTAMP,
  opt_in_community BOOLEAN     DEFAULT TRUE,
  UNIQUE KEY uq_group_member (group_id, roll_no),
  FOREIGN KEY (group_id) REFERENCES community_groups(group_id),
  FOREIGN KEY (roll_no)  REFERENCES students(roll_no)
);
```

---

## 7. What Each Table Is Used For

| Table | Used For |
|---|---|
| `hostels` | Populates the hostel dropdown on the student registration form. Students belong to one hostel. Friend search is limited to the same hostel. |
| `students` | Stores all student accounts. Passwords are hashed with bcrypt. OTP is temporarily stored here during the verification flow. |
| `admins` | Admin accounts that can log into the admin dashboard. Separate from student accounts — different login endpoint. |
| `ecommerce_platforms` | Populates the platform dropdown when admins log a package arrival (Amazon, Flipkart, etc.). |
| `packages` | Core table. Every parcel logged by an admin. Tracks status from PENDING → COLLECTED or PENDING → OVERDUE → RETURNING → RETURNED. |
| `friendships` | Student-to-student friend connections. Status goes PENDING → ACCEPTED or DECLINED. Only ACCEPTED friends can be authorized for pickup. |
| `pickup_auths` | One row per authorization. When a student authorizes a friend to collect a package, a row is created here. The friend must accept or decline. |
| `notifications` | All in-app alerts. Created automatically when packages arrive, deadlines approach, friend requests come in, or pickups are authorized. |
| `community_groups` | One group is auto-created per hostel when someone first uses community features. Not manually managed. |
| `group_members` | Tracks whether each student has opted in to seeing friends' packages arriving today. |

---

## 8. Environment Variables Reference

### Backend `.env` (full reference)

| Variable | Required | Example | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `mysql://npm_user:pass@localhost:3306/npm_db` | MySQL connection string. Format: `mysql://USER:PASS@HOST:PORT/DB_NAME` |
| `JWT_SECRET` | Yes | `a3f9b2c1d...` (64 hex chars) | Secret key for signing auth tokens. Must be long and random. Never share this. |
| `JWT_EXPIRES_IN` | Yes | `7d` | How long a login session lasts. `7d` = 7 days, `24h` = 24 hours. |
| `PORT` | Yes | `5000` | Port the Express server listens on. |
| `TWILIO_ACCOUNT_SID` | Production only | `ACxxx...` | From Twilio console. Not used when `NODE_ENV=development`. |
| `TWILIO_AUTH_TOKEN` | Production only | `abc123...` | From Twilio console. Not used when `NODE_ENV=development`. |
| `TWILIO_PHONE_NUMBER` | Production only | `+14155552671` | The Twilio number that sends SMS. Must include country code. |
| `FRONTEND_URL` | Yes | `http://localhost:3000` | Used for CORS. Must match exactly where the React app runs. |
| `NODE_ENV` | Yes | `development` | Set to `development` to skip real SMS. Set to `production` for live SMS. |
| `OTP_EXPIRY_MINUTES` | Yes | `10` | OTP expires after this many minutes. |
| `PICKUP_DEADLINE_DAYS` | Yes | `7` | Default number of days before a package is considered overdue. Admin can override per package. |

### Frontend `.env` (full reference)

| Variable | Required | Example | Description |
|---|---|---|---|
| `REACT_APP_API_URL` | Yes | `http://localhost:5000/api` | The backend API base URL. All API calls go here. Must NOT have a trailing slash. |

---

## 9. Verification Checklist

Work through these in order. Each item confirms the previous steps worked.

### MySQL

| Item | Confirms |
|---|---|
| `mysql --version` prints version 8.x | MySQL is installed correctly |
| Can log in: `mysql -u npm_user -p npm_db` without errors | Database user credentials are correct |
| `SHOW TABLES;` shows all 9 tables after running Prisma migrate | Migrations ran successfully |

### Backend

| Item | Confirms |
|---|---|
| `npm install` completes without errors inside `backend/` | Dependencies installed correctly |
| `.env` file exists in `backend/` (not `.env.example`) | Environment file was created |
| `DATABASE_URL` in `.env` uses the correct username, password, and database name | Database connection string is correct |
| `npx prisma migrate dev --name init` completes and shows "Applied 1 migration" | Schema was applied to the database |
| `npx prisma generate` completes without errors | Prisma client was generated |
| At least 1 hostel row exists in the `hostels` table | Seed data step was completed |
| At least 1 admin row exists in the `admins` table | Seed data step was completed |
| At least 1 row exists in `ecommerce_platforms` | Seed data step was completed |
| `npm run dev` prints "Database connected successfully" and "NPM Server running on port 5000" | Backend server started correctly |
| `curl http://localhost:5000/health` returns `{"status":"ok",...}` | API is reachable |

### Frontend

| Item | Confirms |
|---|---|
| `npm install` completes without errors inside `frontend/` | Dependencies installed correctly |
| `.env` file exists in `frontend/` with `REACT_APP_API_URL=http://localhost:5000/api` | Environment file was created |
| `npm start` opens `http://localhost:3000` in the browser | Frontend dev server started correctly |
| The landing page loads with no errors in the browser console | Frontend build is functioning |
| The hostel dropdown on the Register page shows the hostels you inserted | Backend and frontend are connected correctly |

### End-to-End Test

| Item | Confirms |
|---|---|
| Register a new student through the UI | Registration flow works |
| Log in as that student — dashboard loads | Student login and dashboard work |
| Log in as admin — admin dashboard loads | Admin login and dashboard work |
| Admin logs a package arrival for that student's phone number | Package logging works |
| Student's dashboard shows the pending package | Full flow is connected end to end |

---

## 10. Common Errors and Fixes

### `Error: P1001 Can't reach database server`
**Cause:** MySQL is not running, or the credentials in `DATABASE_URL` are wrong.
```bash
# Start MySQL on macOS
brew services start mysql

# Start MySQL on Linux
sudo systemctl start mysql

# Start MySQL on Windows — open Services app, find MySQL80, click Start
```
Also double-check: the username, password, host (`localhost`), port (`3306`), and database name in `DATABASE_URL` all match what you set up in step 2.1.

---

### `Error: P3009 migrate found failed migration`
**Cause:** A previous migration attempt failed halfway.
```bash
npx prisma migrate resolve --rolled-back 20240101000000_init
npx prisma migrate dev --name init
```

---

### `Access denied for user 'npm_user'@'localhost'`
**Cause:** Wrong password in `DATABASE_URL`, or the MySQL user doesn't have permissions.
```bash
mysql -u root -p
GRANT ALL PRIVILEGES ON npm_db.* TO 'npm_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

### `Cannot find module '@prisma/client'`
**Cause:** `npm install` wasn't run, or Prisma client wasn't generated.
```bash
cd backend
npm install
npx prisma generate
```

---

### Frontend shows "Network Error" or blank data
**Cause:** The backend is not running, or `REACT_APP_API_URL` in `frontend/.env` is wrong.
- Make sure `npm run dev` is running in the `backend/` folder in a separate terminal
- Check `frontend/.env` has exactly: `REACT_APP_API_URL=http://localhost:5000/api`
- After editing `.env`, restart `npm start` in the frontend

---

### Hostel dropdown is empty on Register page
**Cause:** No rows in the `hostels` table.
- Run the hostel INSERT statements from step 4.5
- Or open Prisma Studio (`npx prisma studio`) and add hostels manually

---

### OTP not received (production mode)
**Cause:** Twilio trial accounts can only SMS verified numbers.
- In the Twilio console, go to **Verified Caller IDs** and verify the recipient's number
- Or set `NODE_ENV=development` to use console OTPs instead

---

### `npm start` fails with `react-scripts: command not found`
**Cause:** `npm install` was not run in the `frontend/` folder.
```bash
cd frontend
npm install
npm start
```

---

### Port 3000 or 5000 already in use
```bash
# Find what's using the port (macOS/Linux)
lsof -i :5000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change the port in .env (backend) and restart
```

---

## Quick Start Summary

Once the full setup has been completed, from any subsequent time forward only the following is required:

**Terminal 1 — Backend:**
```bash
cd npm-project/backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd npm-project/frontend
npm start
```

Open `http://localhost:3000`.

---

*NPM — NITK Package Manager · Phase 1 · NITK Surathkal*
*Team: Aradhya Mohapatra (241CS212), Rajsimha MV (241CS246), Rohith Kalluraya K (241CS248), Srikarthik Sankarkumar (241CS260)*