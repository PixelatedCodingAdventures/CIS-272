ADR - Database

Status:
Accepted

Decision:
We chose MySQL 8.0 as the database for our Equipment Checkout application.

Options Considered:
MySQL
PostgreSQL
SQLite

Why We Chose It:
Our team has experience using MySQL, and it works well with Node.js and Express. MySQL will allow us to store equipment information, user accounts, and checkout records.

What We Are Giving Up:
MySQL requires a database server to be configured and maintained, unlike SQLite, which stores data in a local file.
