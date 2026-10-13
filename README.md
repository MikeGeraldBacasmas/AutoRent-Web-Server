# RentRide Web Server & Database

Backend REST API server and MySQL database schema/procedures for the RentRide platform.

---

## 📁 Project Structure

```
RentRide-Web-Server/
├── database/
│   ├── schema.sql       # Database tables, keys, and constraints
│   ├── procedures.sql   # Stored procedures for business logic
│   └── seed.sql         # Initial sample / testing data
├── server/
│   ├── routes/
│   │   ├── auth.js          # Authentication endpoint (/api/auth)
│   │   ├── users.js         # User management (/api/users)
│   │   ├── registrations.js # Account registration requests (/api/registrations)
│   │   ├── vehicles.js      # Vehicle fleet management (/api/vehicles)
│   │   ├── reservations.js  # Reservations (/api/reservations)
│   │   ├── rentals.js       # Active & completed rentals (/api/rentals)
│   │   ├── maintenance.js   # Maintenance records (/api/maintenance)
│   │   ├── damage.js        # Damage inspection reports (/api/damage-reports)
│   │   └── notifications.js # System notifications (/api/notifications)
│   ├── db.js                # MySQL connection pool and procedure helper
│   └── index.js             # Express app entrypoint & middleware
├── .env.example         # Environment variables template
└── package.json         # Node.js dependencies and scripts
```

---

## 🚀 Setup & Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) (v8.0+)

### 2. Database Initialization
Create (or use) your database, then run the SQL scripts against it, in order
(replace `<database>` e.g. with `u463580331_vrent_db`):

```bash
# 1. Create tables
mysql -h <host> -u <user> -p <database> < database/schema.sql

# 2. Create stored procedures
mysql -h <host> -u <user> -p <database> < database/procedures.sql

# 3. (Optional) Load sample seed data
mysql -h <host> -u <user> -p <database> < database/seed.sql
```

Alternatively `npm run setup-db` runs all three using the credentials in `.env`.
Scripts that modify data (`setup-db`, `clean-db`) refuse to run against a remote host
unless you pass `--force` (e.g. `npm run setup-db -- --force`).

### 3. Environment Configuration
Copy the `.env.example` file to `.env` and fill in your MySQL credentials.
`.env` is gitignored — **never commit it**.

```bash
cp .env.example .env
```

Edit `.env` (all `DB_*` values and `JWT_SECRET` are required):
```env
SERVER_PORT=4000
CLIENT_ORIGIN=http://localhost:8443   # comma-separated for multiple origins
JWT_SECRET=<long random string>

DB_HOST=<your db host>
DB_PORT=3306
DB_USER=<your db user>
DB_PASSWORD=<your db password>
DB_NAME=u463580331_vrent_db
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start the Server

- **Development mode (with auto-reload):**
  ```bash
  npm run dev
  ```
- **Production mode:**
  ```bash
  npm start
  ```

API will be accessible at: `http://localhost:4000/api`
Health check: `http://localhost:4000/api/health`