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
Create the database and execute the SQL scripts in order:

```bash
# 1. Create schema and tables
mysql -u root -p < database/schema.sql

# 2. Create stored procedures
mysql -u root -p autorent < database/procedures.sql

# 3. (Optional) Load sample seed data
mysql -u root -p autorent < database/seed.sql
```

### 3. Environment Configuration
Copy the `.env.example` file to `.env` and fill in your MySQL credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
SERVER_PORT=4000
CLIENT_ORIGIN=http://localhost:8443

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=autorent
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