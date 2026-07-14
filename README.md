# Chat Support Service

[![CI](https://github.com/Milad93R/chat-support-service/actions/workflows/ci.yml/badge.svg)](https://github.com/Milad93R/chat-support-service/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A real-time support platform with an embeddable chat widget, an operator dashboard, and a NestJS WebSocket API. Messages, rooms, tickets, comments, read state, and notification counts are persisted in MongoDB.

![Chat Support dashboard](https://github.com/user-attachments/assets/3d06398e-1bf7-4d76-b600-f805d49741f7)

## What is included

- A Next.js 15 operator dashboard and admin view
- A standalone Webpack widget that can be embedded in another site
- A NestJS API with REST and Socket.IO interfaces
- Chat rooms, ticket lifecycle, comments, read receipts, and unread counts
- MongoDB persistence through Mongoose
- Swagger documentation at `/api`
- A Docker Compose development stack for the API and MongoDB

The login route currently uses a fixed demo administrator in the Next.js application. It is useful for running the example locally, but it is not a production authentication implementation.

## Architecture

```text
browser / embedded widget
        |
        | REST + Socket.IO
        v
Next.js dashboard (3078) ----> NestJS API (3003) ----> MongoDB
```

The repository is split into two independently installable applications:

```text
apps/web/                 Next.js dashboard and standalone widget
back/user-service/        NestJS REST/WebSocket service
```

## Run locally

Requirements: Node.js 20 or newer, npm, and Docker.

Start MongoDB:

```bash
cd back/user-service
docker compose up -d mongodb
```

Start the API:

```bash
cd back/user-service
npm ci
MONGODB_URI=mongodb://localhost:27016/chat-support npm run start:dev
```

Start the dashboard in another terminal:

```bash
cd apps/web
npm ci
JWT_SECRET=replace-this-for-local-development \
DEMO_ADMIN_EMAIL=admin@example.com \
DEMO_ADMIN_PASSWORD=replace-this-for-local-development \
BACKEND_URL=http://localhost:3003 \
NEXT_PUBLIC_API_URL=http://localhost:3003 \
npm run dev
```

Open:

- Dashboard: http://localhost:3078
- Admin view: http://localhost:3078/admin
- API documentation: http://localhost:3003/api

Use the email and password you supplied through `DEMO_ADMIN_EMAIL` and `DEMO_ADMIN_PASSWORD`.

To run the complete backend development stack instead, use:

```bash
cd back/user-service
docker compose up --build
```

## Build the embedded widget

```bash
cd apps/web
npm ci
npm run build:widget
```

The bundle is written to `apps/web/dist`. A host page can configure it with data attributes:

```html
<div
  id="chat-widget"
  data-api-base-url="https://api.example.com"
  data-socket-url="https://api.example.com">
</div>
<script src="/chat-widget.js"></script>
```

See [the widget guide](apps/web/widget/README.md) for configuration and integration details.

## Main API areas

| Area | Examples |
| --- | --- |
| Rooms | `POST /chat-rooms`, `GET /chat-rooms/:roomId` |
| Messages | `POST /chat-rooms/:roomId/messages` |
| Notifications | `GET /chat-rooms/notifications/counts` |
| Tickets | `POST /support/tickets`, `GET /support/tickets/:ticketId` |
| Comments | `POST /support/tickets/:ticketId/comments` |
| Operations | `GET /support/admin/stats` |

The WebSocket gateway supports room membership, agent registration, message delivery, read state, notification counts, and room-status changes. The source of truth is [`chat.gateway.ts`](back/user-service/src/support/chat.gateway.ts).

## Verification

Run the same checks used in CI:

```bash
cd apps/web
npm ci
npm run build

cd ../../back/user-service
npm ci
npm run build
npm test -- --runInBand
```

Both applications currently report zero runtime dependency advisories with `npm audit --omit=dev`.

## Screenshots

| Main application | Admin dashboard | Widget |
| --- | --- | --- |
| ![Main application](https://github.com/user-attachments/assets/3d06398e-1bf7-4d76-b600-f805d49741f7) | ![Admin dashboard](https://github.com/user-attachments/assets/e7fa17dd-8ed1-4f0d-8932-36f4ee4822bd) | ![Chat widget](https://github.com/user-attachments/assets/f71cc4ed-c260-4af0-b835-6347799c902e) |

## License

MIT. See [LICENSE](LICENSE).
