[![CI](https://github.com/PixelatedCodingAdventures/CIS-272/actions/workflows/ci.yml/badge.svg)](https://github.com/PixelatedCodingAdventures/CIS-272/actions/workflows/ci.yml)

# Cloning the branch

In terminal: git clone git@github.com:PixelatedCodingAdventures/CIS-272.git <br>
cd to folder and type: <br>
git checkout develop <br>
this should bring in all the files.

# Installing

Type: npm install <br>
This should install all the dependencies in package.json

# Environment credentials

`.env.example` documents all environment variables used by the application. \<br>
The `.env` file is used for local development credentials and is excluded from Git. \<br>
Docker provides the required environment variables automatically, so a `.env` file is not required when running the application with Docker.

# db.js

This file is to do with database connection. pulls in info from the .env file.

# app.js

Serves one page or API endpoint (GET /) - (localhost:3000) <br>
Health check for app + DB (GET /health) - (localhost:3000/health)

# migrate.js

Runs SQL database migrations using the MySQL connection pool in `db.js`. <br>
Creates a `schema_migrations` table to track completed migrations. <br>
Processes migration files in filename order and skips migrations that have already been applied.

Current migration files:

- `001_initial.sql` - Creates the initial `app_setup` table.
- `002_create_users.sql` - Creates the users table and defines user roles.
- `003_create_equipment.sql` - Creates the equipment inventory table.
- `004_create_loans.sql` - Creates the loans table with foreign keys and checkout constraints.

Run migrations using:

```
npm run migrate
```

Migrations also run automatically when the application starts through Docker Compose.

# Database Schema

Sprint 2 introduces three main database tables: `users`, `equipment`, and `loans`.

## Users Table

Stores application users and their assigned roles.

- `id` - Primary key.
- `name` - User's name.
- `email` - Unique email address.
- `password_hash` - Stores the hashed password.
- `role` - Borrower, lab staff, or department lead.
- `is_active` - Indicates whether the account is active.
- Timestamps track record creation and updates.

## Equipment Table

Stores equipment inventory and availability information.

- `id` - Primary key.
- `name` - Equipment name.
- `asset_tag` - Unique equipment identifier.
- `description` - Optional equipment details.
- `status` - Available, checked out, maintenance, or retired.
- `equipment_condition` - Excellent, good, fair, poor, or damaged.
- Timestamps track record creation and updates.

## Loans Table

Tracks equipment checkouts and returns.

- `id` - Primary key.
- `borrower_id` - Foreign key referencing `users.id`.
- `equipment_id` - Foreign key referencing `equipment.id`.
- `checkout_date` - Date equipment was checked out.
- `due_date` - Required return date.
- `return_date` - Actual return date, if returned.
- `return_condition` - Equipment condition upon return.
- Timestamps track record creation and updates.

## Database Relationships and Constraints

- Each loan belongs to one user and one equipment item.
- Foreign keys prevent loans from referencing nonexistent users or equipment.
- Due dates cannot be earlier than checkout dates.
- Return dates cannot be earlier than checkout dates.
- A unique constraint on the generated `active_equipment_id` column prevents an equipment item from having multiple active loans.
- Once equipment is returned, it can be checked out again.
- Unique constraints prevent duplicate user emails and equipment asset tags.
- Foreign key restrictions prevent deleting users or equipment referenced by loans.

# tests/app.test.js

Jest tests that: (GET /) and expects: "Equipment Checkout API" <br>
Jest tests that: (GET /health) and expects: {"app":"up","database":"up"}

# tests/database.test.js

Jest tests that verify the Sprint 2 database schema and constraints.

The seven automated tests verify:

- All required database tables exist.
- All four migrations are recorded in `schema_migrations`.
- Loans cannot reference nonexistent borrowers.
- Loans cannot reference nonexistent equipment.
- Due dates cannot be earlier than checkout dates.
- Equipment cannot have multiple active loans.
- Returned equipment can be checked out again.

Run all automated tests locally:

```
npm test -- --runInBand
```

Run all automated tests inside Docker:

```
docker compose exec app npm test -- --runInBand
```

All 9 tests (2 application tests and 7 database tests) passed locally and inside Docker during Sprint 2 verification.

# server.js

Launches the webserver

# launch steps

npm run migrate - sends mysql table to DB. <br>
npm test - runs Jest tests. <br>
npm run lint - runs linter (should show nothing if linter passes) <br>
npm start - starts the webserver

# CI/CD

the github actions for CI/CD runs from a single file: .github\workflows\ci.yml <br>
This takes a few minutes because it has to load a Linux server, install Node.js and MySQL, and then run the tests. <br>
To view pipeline click "actions tab" after a push/merge to develop/main.

# Deployment

The Equipment Checkout application is deployed on an OVHcloud VPS running Ubuntu Linux with Node.js 24, Express.js, and MySQL 8.0.

# Production Environment

- Hosting Provider: OVHcloud VPS
- Operating System: Ubuntu Linux
- Runtime: Node.js 24
- Backend: Express.js
- Database: MySQL 8.0
- Process Manager: Forever
- Version Control: GitHub

# Public URLs

Live Application: https://www.equipmentcheckout.online

Health Check: https://www.equipmentcheckout.online/health

# Deployment Steps

## Update the Server

Update the Ubuntu package list and install curl:

```
sudo apt update
sudo apt install -y curl
```

## Install Node.js 24

Install Node.js 24 using the NodeSource repository:

```
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
```

## Install MySQL

Install MySQL 8.0:

```
sudo apt install mysql-server -y
```

Enable MySQL to start automatically when the server boots:

```
sudo systemctl enable mysql
sudo systemctl start mysql
```

## Configure the Database

Open the MySQL console:

```
sudo mysql
```

Create the database and database user:

```
CREATE DATABASE equipment_checkout;

CREATE USER 'YOUR_DB_USER'@'localhost'
IDENTIFIED BY 'YOUR_SECURE_PASSWORD';

GRANT ALL PRIVILEGES
ON equipment_checkout.*
TO 'YOUR_DB_USER'@'localhost';

FLUSH PRIVILEGES;
```

Replace the placeholders with the production database credentials. Do not commit actual production passwords to GitHub.

Exit the MySQL console:

```
EXIT;
```

## Clone the Repository

Clone the Equipment Checkout repository onto the Ubuntu server:

```
git clone https://github.com/PixelatedCodingAdventures/CIS-272.git
cd CIS-272
```

Check out the branch or release intended for production.

## Install Dependencies

Install the application dependencies:

```
npm install
```

Configure the production environment variables using `.env.example` as a reference.

## Run Database Migrations

Before starting the application, apply any pending database migrations:

```
npm run migrate
```

The migration runner creates the required database tables, records completed migrations in `schema_migrations`, and skips migrations that have already been applied.

Ensure the production database credentials are configured correctly before running this command.

Note: Production migrations should be coordinated with the team member responsible for deployment. Do not reset or delete the production database.

## Install Forever

Forever is used to keep the Node.js application running and restart it if the process crashes.

Install Forever globally:

```
sudo npm install -g forever
```

## Start the Application

Start the Express.js application:

```
forever start server.js
```

To view running processes:

```
forever list
```

To stop the application:

```
forever stop server.js
```

Note: Forever does not automatically configure application startup after a server reboot. Additional startup configuration is required.

# Deployment Verification

## Application Endpoint

Open the following URL:

https://www.equipmentcheckout.online

The page should display:

```
Equipment Checkout API
```

## Health Check Endpoint

To verify that both the application and database are running correctly, open:

https://www.equipmentcheckout.online/health

The health endpoint should return:

```
{"app":"up","database":"up"}
```

# Deployment Notes

The production application runs directly on an Ubuntu Linux VPS using Node.js, Express.js, MySQL 8.0, and Forever.

Docker is used separately for local development and testing.

GitHub Actions runs automated CI checks when changes are pushed or merged to develop/main.

The public application URLs are documented in this README and shared with the development team through Slack.

Additional production details, including HTTPS configuration, database migrations, automatic startup after reboot, and future deployment updates, should be confirmed with the team member responsible for the VPS.

# Docker Setup

The application can be run using Docker with Node.js 22 and MySQL 8.0. Docker provides a consistent development environment for all team members without requiring Node.js or MySQL to be installed locally.

## Prerequisites

Before running the project with Docker, install:

- Git & Docker Desktop

Docker Desktop must be running before using the Docker commands below.

## Start the Application

From the project root directory, run: (the `bash` breaks the code colors. Don't include with your terminal commands)

```bash
docker compose up --build
```

Docker will automatically:

- Build the Node.js 22 application container.
- Start the MySQL 8.0 database container.
- Create the application database and database user.
- Wait for MySQL to become healthy.
- Run all pending database migrations in filename order.
- Skip migrations that have already been applied.
- Start the application on port 3000.
  Once startup is complete, open:
  `http://localhost:3000`
  The page should display:
  `Equipment Checkout API`
  To verify that both the application and database are running correctly, open:
  `http://localhost:3000/health`
  The health endpoint should return:

```json
{ "app": "up", "database": "up" }
```

## Stop the Application

If Docker Compose is running in the terminal, press: (May take a bit to "quit". Repeat a second time.)
`Ctrl+C`
The containers can also be stopped with:

```bash
docker compose down
```

The MySQL database data is preserved in a Docker volume when the containers are stopped.

## Restart the Application

To start the application again, run:

```bash
docker compose up
```

To rebuild the application image and start the containers, run:

```bash
docker compose up --build
```

## Run Automated Tests

While the Docker containers are running, open another terminal in the project root and run:

```bash
docker compose exec app npm test
```

This runs the Jest test suite inside the Node.js 22 application container.

## Run ESLint

While the Docker containers are running, run:

```bash
docker compose exec app npm run lint
```

If linting passes, ESLint should complete without reporting errors.

## Reset the Docker Database

To completely remove the Docker MySQL database and recreate it from scratch, run:

```bash
docker compose down -v
```

Then start the application again:

```bash
docker compose up --build
```

WARNING: The `-v` option deletes all data stored in the Docker MySQL volume. Only use this command when a fresh database is required.

## Docker Services

The Docker environment contains two services:

- `app` - Node.js 22 / Express application running on port 3000.
- `db` - MySQL 8.0 database used by the application.

The application connects to MySQL through Docker's internal network using the service name `db`. MySQL does not need to be installed locally when using the Docker setup.

## Troubleshooting

If Docker commands fail, verify that Docker Desktop is installed and running.
To check the current status of the containers:

```bash
docker compose ps
```

To view container logs:

```bash
docker compose logs
```

If database initialization or migration problems require a completely fresh database:

```bash
docker compose down -v
docker compose up --build
```

Remember that removing the Docker volume deletes all data stored in the Docker database.

## Definition of Done

A sprint is considered done when:

- [ ] All acceptance criteria are met.
- [ ] Automated tests are written and passing.
- [ ] The pull request has been reviewed and approved by at least one teammate.
- [ ] GitHub Actions CI is passing.
- [ ] Changes are merged into main and deployed.
- [ ] Any required documentation is updated.

## React

To launch the React frontend, run the following command from the project root directory:

```bash
 "npm run dev"
```

The 'src' folder contains the React components. Take a look at 'App.jsx' to familiarize yourself with the code.
