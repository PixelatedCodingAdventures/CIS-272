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

# for docker
add node and all the files - (node port 3000)<br>
add mysql with configuration from the .env