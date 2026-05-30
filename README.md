# INSAT Connect

## Architecture

This project is built using a microservices-oriented architecture with the following main components:

1. **Frontend (`/frontend`)**
   - **Framework:** Next.js 16 (App Router) with React 19.
   - **Styling:** Tailwind CSS v4 for utility-first styling.
   - **Features:** Client-side application with Real-time communication using `socket.io-client`.

2. **Core Backend (`/backend`)**
   - **Framework:** NestJS.
   - **API:** GraphQL (`@nestjs/graphql`, Apollo Server) and REST.
   - **Database:** Prisma ORM (`@prisma/client`) for database management.
   - **Real-time:** WebSockets (`@nestjs/websockets`, `socket.io`) for chat and real-time notifications.
   - **Authentication:** JWT and Passport (`@nestjs/jwt`, `@nestjs/passport`).

3. **Calendar Microservice (`/calendar-server`)**
   - **Framework:** NestJS.
   - **Database:** Prisma ORM with SQLite/libSQL adapter (`@libsql/client`, `@prisma/adapter-libsql`).
   - **Purpose:** Dedicated service for handling academic calendar operations, scheduling, and synchronization.

---

## Running the Application

To run the application locally, you will need to start all three services in separate terminal windows.

### 1. Frontend
```bash
cd frontend
npm run dev
```

### 2. Core Backend
```bash
cd backend
npm run start
```

### 3. Calendar Microservice
```bash
cd calendar-server
npm run start
```

---

## Tests & Demo Accounts

To test the 3 portals, use the credentials defined in the seed file (no registration required, accounts are assumed to be already created).

The exact logins can be found in the project's seed file:
- **Student Portal** : `etudiant@insat.tn` / `etudiant123` and `sarra@insat.tn` / `student456`
- **Teacher Portal** : `m.slim@insat.u-cartago.tn` / `teacher123`
- **Admin Portal** : `admin@insat.tn` / `admin123`
