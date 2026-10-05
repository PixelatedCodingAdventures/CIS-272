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

credentials for the database are stored in the file ".env" <br>
Along with ports and DB local ip address.

# db.js

This file is to do with database connection. pulls in info from the .env file.

# app.js

Serves one page or API endpoint (GET /) - (localhost:3000) <br>
Health check for app + DB (GET /health) - (localhost:3000/health)

# migration.js

Connects to DB + migration <br>
Uploads a basic table from: migrations/001_initial.sql

# tests/app.test.js

Jest tests that: (GET /) and expects: "Equipment Checkout API" <br>
Jest tests that: (GET /health) and expects: {"app":"up","database":"up"}

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
- Run the database migration.
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
**## Run ESLint**
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
