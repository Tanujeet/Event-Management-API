# Event Management API

A REST API for managing events and user registrations, built with Node.js, Express, and PostgreSQL.

## Features
- Create and view events
- Register/cancel registration for events
- View upcoming events with custom sorting
- Get event statistics

## Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd event-management-api
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Setup environment variables:**
    Create a `.env` file in the root directory and add your PostgreSQL connection string:
    ```
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```

4.  **Run database migrations:**
    ```bash
    npx prisma migrate dev
    ```

5.  **Start the server:**
    ```bash
    npm start
    ```
    The API will be available at `http://localhost:3000`.

## API Endpoints

### Create Event
- **URL:** `/api/events`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "title": "Tech Conference 2025",
    "dateTime": "2025-10-15T10:00:00.000Z",
    "location": "Online",
    "capacity": 500
  }
  ```
- **Success Response:** `201 Created`
  ```json
  { "eventId": 1 }
  ```

---
*(...continue this pattern for all other endpoints...)*