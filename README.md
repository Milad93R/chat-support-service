

<div align="center">

# Chat Support Service

![Chat Support Service](https://github.com/user-attachments/assets/63661971-9bcc-496c-bb01-78aa71968b23)


![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript) ![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?style=for-the-badge&logo=mongodb) ![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)

**A comprehensive real-time chat support service with embeddable widgets, admin dashboard, and backend API.**

[Demo](#-demo) • [Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-api-endpoints) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Demo](#-demo)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
- [Chat Widget System](#-chat-widget-system)
- [Admin Dashboard](#-admin-dashboard)
- [API Endpoints](#-api-endpoints)
- [WebSocket Events](#-websocket-events)
- [Docker Development](#-docker-development)
- [Testing](#-testing)
- [Configuration](#-configuration)
- [Performance](#-performance)
- [Security](#-security)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

## 🎯 Demo

> **Live Demo**: [Coming Soon](#) | **Widget Demo**: Open `apps/web/dist/demo.html` after building

This system enables businesses to provide customer support through chat widgets embedded on their websites, with real-time messaging, ticket management, and admin oversight.

## 🚀 Features

### 🎨 Core Features
- **Real-time Chat**: WebSocket-powered instant messaging between clients and support agents
- **Embeddable Widget**: Standalone chat widget that can be embedded on any website
- **Admin Dashboard**: Comprehensive interface for managing chat rooms, tickets, and support operations
- **Ticket Management**: Automatic ticket creation from chat conversations with full lifecycle management
- **Dual Widget System**: Both integrated and standalone widget options
- **Theme Support**: Dark/light theme switching with system preference detection
- **Persistent Sessions**: Chat history and user data preserved across sessions
- **Notification System**: Real-time notifications for new messages and unread counts
- **CORS Support**: Configured for cross-origin requests including file:// protocol

### ⚡ Advanced Features
- **Anonymous Chat**: Clients can start conversations without registration
- **Agent Assignment**: Automatic or manual assignment of support agents to chat rooms
- **Chat History**: Full conversation history with search and filtering
- **Status Management**: Room status tracking (waiting, active, closed)
- **Message Read Receipts**: Track read/unread status for both clients and agents
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Bundle Optimization**: ~447KB minified widget with tree shaking and code splitting

## 📸 Screenshots


<div align="center">

| Main Application | Admin Dashboard | Chat Widget |
|:---:|:---:|:---:|
| ![Main App](https://github.com/user-attachments/assets/3d06398e-1bf7-4d76-b600-f805d49741f7) | ![Admin Dashboard](https://github.com/user-attachments/assets/e7fa17dd-8ed1-4f0d-8932-36f4ee4822bd) | ![Chat Widget](https://github.com/user-attachments/assets/f71cc4ed-c260-4af0-b835-6347799c902e) |

</div>

## 📁 Project Structure

<details>
<summary>Click to expand project structure</summary>

```
chat/
├── apps/
│   └── web/                           # Next.js Frontend Application
│       ├── app/
│       │   ├── components/            # React Components
│       │   │   ├── ChatWidget.tsx           # Integrated chat widget
│       │   │   ├── ChatWidgetSelector.tsx   # Widget type selector
│       │   │   ├── Header.tsx               # Navigation header
│       │   │   ├── Footer.tsx               # Footer component
│       │   │   └── ThemeToggle.tsx          # Theme switching
│       │   ├── admin/                 # Admin Dashboard
│       │   │   └── page.tsx                 # Admin panel for chat management
│       │   ├── api/                   # Next.js API Routes
│       │   │   ├── auth/                    # Authentication endpoints
│       │   │   ├── chat-rooms/              # Chat room management
│       │   │   └── dashboard/               # Dashboard APIs
│       │   ├── context/               # React Contexts
│       │   │   ├── AuthContext.tsx          # Authentication state
│       │   │   └── ThemeContext.tsx         # Theme management
│       │   ├── hooks/                 # Custom React Hooks
│       │   │   ├── useWebSocket.ts          # WebSocket connection
│       │   │   └── usePageData.ts           # Page data management
│       │   ├── login/                 # Login page
│       │   ├── layout.tsx             # Root layout
│       │   └── page.tsx               # Home page
│       ├── widget/                    # Standalone Chat Widget
│       │   ├── components/            # Widget-specific components
│       │   │   ├── ChatHeader.tsx           # Widget header
│       │   │   ├── ChatFooter.tsx           # Widget footer
│       │   │   ├── MessageInput.tsx         # Message input component
│       │   │   ├── MessageDisplay.tsx       # Message display
│       │   │   ├── EmailInputForm.tsx       # Email input form
│       │   │   └── ChatToggleButton.tsx     # Widget toggle button
│       │   ├── contexts/              # Widget contexts
│       │   │   └── ThemeProvider.tsx        # Widget theme provider
│       │   ├── hooks/                 # Widget hooks
│       │   │   └── useWebSocket.ts          # Widget WebSocket hook
│       │   ├── types/                 # TypeScript types
│       │   ├── config/                # Widget configuration
│       │   ├── utils/                 # Utility functions
│       │   ├── StandaloneChatWidget.tsx     # Main standalone widget
│       │   ├── index.tsx              # Widget entry point
│       │   ├── styles.css             # Widget styles
│       │   └── demo.html              # Widget demo page
│       ├── scripts/                   # Build scripts
│       │   └── set-chat-widget.js           # Widget type switcher
│       ├── dist/                      # Built widget files
│       ├── test.html                  # Widget test page
│       ├── webpack.config.js          # Widget build configuration
│       └── package.json               # Dependencies and scripts
└── back/
    └── user-service/                  # NestJS Backend Service
        ├── src/
        │   ├── support/               # Support System Module
        │   │   ├── schemas/           # MongoDB Schemas
        │   │   │   ├── chat-room.schema.ts  # Chat room data model
        │   │   │   ├── ticket.schema.ts     # Support ticket model
        │   │   │   └── comment.schema.ts    # Comment model
        │   │   ├── dto/               # Data Transfer Objects
        │   │   │   ├── chat-room.dto.ts     # Chat room DTOs
        │   │   │   └── create-ticket.dto.ts # Ticket creation DTOs
        │   │   ├── support.controller.ts    # Support API endpoints
        │   │   ├── support.service.ts       # Support business logic
        │   │   ├── chat-room.controller.ts  # Chat room endpoints
        │   │   ├── chat-room.service.ts     # Chat room business logic
        │   │   ├── chat.gateway.ts          # WebSocket gateway
        │   │   └── support.module.ts        # Support module definition
        │   ├── app.module.ts          # Main application module
        │   └── main.ts                # Application bootstrap
        ├── docker-compose.yml         # Docker development setup
        ├── Dockerfile                 # Production Docker image
        ├── Dockerfile.dev             # Development Docker image
        └── package.json               # Backend dependencies
```

</details>

## 🛠 Technology Stack

<div align="center">

### Frontend Stack
[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?logo=next.js&logoColor=white)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react&logoColor=white)](https://reactjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/) [![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12.6.1-pink?logo=framer&logoColor=white)](https://www.framer.com/motion/) [![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-010101?logo=socket.io&logoColor=white)](https://socket.io/)

### Backend Stack
[![NestJS](https://img.shields.io/badge/NestJS-Latest-red?logo=nestjs&logoColor=white)](https://nestjs.com/) [![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?logo=mongodb&logoColor=white)](https://www.mongodb.com/) [![Mongoose](https://img.shields.io/badge/Mongoose-ODM-brown?logo=mongoose&logoColor=white)](https://mongoosejs.com/)

[![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=json-web-tokens&logoColor=white)](https://jwt.io/) [![Swagger](https://img.shields.io/badge/Swagger-API%20Docs-85EA2D?logo=swagger&logoColor=white)](https://swagger.io/)

### DevOps & Tools
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker&logoColor=white)](https://www.docker.com/) [![Webpack](https://img.shields.io/badge/Webpack-5-8DD6F9?logo=webpack&logoColor=white)](https://webpack.js.org/) [![ESLint](https://img.shields.io/badge/ESLint-Linting-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)

</div>

### Detailed Stack Information

**Frontend (Next.js Application)**
- **Framework**: Next.js 15.2.4 with App Router
- **Runtime**: React 19.0.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion 12.6.1
- **WebSocket**: Socket.io-client 4.8.1
- **Authentication**: JSON Web Tokens (JWT)
- **Build Tool**: Webpack 5 (for widget bundling)

**Backend (NestJS Service)**
- **Framework**: NestJS (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **WebSocket**: Socket.io with NestJS Gateway
- **Authentication**: JWT with Passport
- **API Documentation**: Swagger/OpenAPI
- **Validation**: Class-validator and Class-transformer
- **Environment**: Docker with Docker Compose

**Widget System**
- **Bundler**: Webpack 5 with UMD output
- **Styling**: CSS with PostCSS
- **Isolation**: Scoped styles with CSS containment
- **Distribution**: Self-contained JavaScript bundle

## 🚀 Quick Start

### Prerequisites

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?style=flat-square&logo=mongodb)
![Docker](https://img.shields.io/badge/Docker-Optional-blue?style=flat-square&logo=docker)

</div>

- Node.js 18+ 
- MongoDB (local or cloud instance)
- Docker and Docker Compose (optional)

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/Milad93R/chat-support-service.git
cd chat-support-service
```

2. **Install dependencies**:
```bash
# Frontend
cd apps/web
npm install

# Backend
cd ../../back/user-service
npm install
```

3. **Environment Configuration**:

**Frontend** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3003
BACKEND_URL=http://localhost:3003
JWT_SECRET=your-super-secret-jwt-key-here

# Chat Widget Configuration
NEXT_PUBLIC_CHAT_WIDGET_TYPE=standalone
```

**Backend** (`back/user-service/.env`):
```env
MONGODB_URI=mongodb://localhost:27017/chat-support
PORT=3003
NODE_ENV=development
```

4. **Start the services**:

**Option A: Using Docker (Recommended)**
```bash
# Start backend services
cd back/user-service
docker compose up -d

# Start frontend
cd ../../apps/web
npm run dev
```

**Option B: Local Development**
```bash
# Start MongoDB locally
mongod

# Start backend
cd back/user-service
npm run start:dev

# Start frontend
cd ../../apps/web
npm run dev
```

5. **Access the application**:
- **Frontend**: http://localhost:3078
- **Admin Dashboard**: http://localhost:3078/admin
- **API Documentation**: http://localhost:3003/api
- **MongoDB Express**: http://localhost:8081 (admin/admin123)

## 🔧 Chat Widget System

### Widget Types

The application supports two widget implementations:

#### 1. Integrated Widget (`ChatWidget.tsx`)
- Fully integrated with the Next.js application
- Uses app's theme system and authentication context
- Best for applications where the widget should match the app's design
- Requires the full Next.js application context

#### 2. Standalone Widget (`StandaloneChatWidget.tsx`)
- Self-contained widget with its own theme system
- Can be embedded in any website without dependencies
- Includes all necessary React components bundled
- Best for third-party integrations and distribution

### Switching Widget Types

**Using NPM Scripts (Recommended)**:
```bash
# Switch to integrated widget
npm run widget:integrated

# Switch to standalone widget
npm run widget:standalone

# Show help and current widget type
npm run widget:help
```

**Manual Configuration**:
Update `.env.local`:
```env
NEXT_PUBLIC_CHAT_WIDGET_TYPE=integrated  # or 'standalone'
```

### Building the Standalone Widget

```bash
cd apps/web
npm run build:widget
```

This creates:
- `dist/chat-widget.js` - The standalone widget bundle
- `dist/demo.html` - Demo page with usage examples

### Embedding the Widget

**Simple HTML Integration**:
```html
<div id="chat-widget-container" 
     data-api-base-url="http://localhost:3003"
     data-socket-url="http://localhost:3003"></div>
<script src="path/to/chat-widget.js"></script>
```

**Programmatic Integration**:
```javascript
window.initChatWidget({
  apiBaseUrl: 'https://your-api-server.com',
  socketUrl: 'https://your-socket-server.com',
  containerId: 'my-chat-widget'
});
```

## 📊 Admin Dashboard

### Features
- **Chat Room Management**: View and manage all active chat rooms
- **Real-time Messaging**: Send and receive messages in real-time
- **Room Assignment**: Assign agents to specific chat rooms
- **Status Management**: Update room status (waiting, active, closed)
- **Message History**: View complete conversation history
- **Notification System**: Real-time notifications for new messages
- **Statistics**: View support metrics and performance data

### Access
- **URL**: http://localhost:3078/admin
- **Default Credentials**:
  - Email: `admin@example.com`
  - Password: `admin123`

### Admin Features
- View all chat rooms with filtering and sorting
- Join chat rooms to assist clients
- Send messages as support agent
- Mark messages as read
- Close chat rooms
- View chat statistics

## 🌐 API Endpoints

<details>
<summary>Click to expand API documentation</summary>

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/profile` - Get user profile

### Chat Rooms
- `GET /api/chat-rooms` - Get all chat rooms
- `POST /api/chat-rooms` - Create new chat room
- `GET /api/chat-rooms/:roomId` - Get specific room
- `PUT /api/chat-rooms/:roomId` - Update room
- `DELETE /api/chat-rooms/:roomId` - Delete room
- `POST /api/chat-rooms/:roomId/messages` - Send message
- `PUT /api/chat-rooms/:roomId/messages/read` - Mark as read
- `GET /api/chat-rooms/:roomId/unread-count` - Get unread count

### Support Tickets
- `GET /api/dashboard/support` - Get support tickets
- `POST /api/dashboard/support` - Create support ticket
- `PUT /api/dashboard/support` - Update support ticket
- `GET /api/dashboard/support/stats` - Get support statistics

### Client-specific
- `GET /api/chat-rooms/client/:clientEmail` - Get client's chat room
- `GET /api/chat-rooms/notifications/counts` - Get notification counts

</details>

## 🔌 WebSocket Events

<details>
<summary>Click to expand WebSocket documentation</summary>

### Client Events
- `join-room` - Join a chat room
- `leave-room` - Leave a chat room
- `send-message` - Send a message
- `mark-messages-read` - Mark messages as read
- `get-notification-counts` - Get notification counts

### Server Events
- `new-message` - New message received
- `room-joined` - Successfully joined room
- `room-left` - Successfully left room
- `notification-counts` - Updated notification counts
- `room-list-update` - Room list updated
- `error` - Error occurred

</details>

## 🐳 Docker Development

### Backend Services
```bash
cd back/user-service
docker compose up -d
```

This starts:
- **MongoDB**: Database server (port 27017)
- **API Service**: NestJS backend (port 3003)
- **Mongo Express**: Database management UI (port 8081)

### Docker Commands
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild and restart
docker compose up --build -d

# Clean up everything
docker compose down -v
```

## 🧪 Testing

### Widget Testing
```bash
# Build the widget
npm run build:widget

# Open test page
open apps/web/test.html
```

### API Testing
The backend includes Swagger documentation at:
- http://localhost:3003/api

### Manual Testing
1. Open the main application: http://localhost:3078
2. Click the chat widget to start a conversation
3. Open admin dashboard: http://localhost:3078/admin
4. Login with admin credentials
5. View the chat room and respond to messages

## 🔧 Configuration

### Environment Variables

**Frontend Configuration**:
```env
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3003
BACKEND_URL=http://localhost:3003
JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_CHAT_WIDGET_TYPE=standalone
```

**Backend Configuration**:
```env
MONGODB_URI=mongodb://localhost:27017/chat-support
PORT=3003
NODE_ENV=development
```

### Widget Configuration
The standalone widget can be configured via:
- HTML data attributes
- JavaScript initialization parameters
- Environment variables (for integrated widget)

### CORS Configuration
The backend is configured to handle CORS for:
- Development origins (localhost ports)
- File protocol (`file://`) for standalone widget testing
- Custom origins (configurable)

## 📈 Performance

### Widget Bundle Size
- **Standalone Widget**: ~447KB minified
- **Includes**: React, Socket.io, all dependencies
- **Optimization**: Tree shaking, code splitting, minification

### Database Performance
- **MongoDB**: Indexed queries for chat rooms and messages
- **WebSocket**: Efficient real-time updates
- **Caching**: Message history and user sessions

## 🔒 Security

### Authentication
- JWT-based authentication for admin users
- Session persistence in localStorage
- Token expiration handling

### CORS Security
- Configured allowed origins
- Credential support for authenticated requests
- Protection against unauthorized access

### Data Validation
- Input validation on all API endpoints
- TypeScript type safety
- MongoDB schema validation

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd apps/web
npm run build
npm start

# Backend
cd back/user-service
npm run build
npm run start:prod

# Widget
cd apps/web
npm run build:widget
```

### Docker Production
```bash
# Backend
cd back/user-service
docker build -t chat-support-api .
docker run -p 3003:3003 chat-support-api

# Frontend
cd apps/web
docker build -t chat-support-web .
docker run -p 3078:3078 chat-support-web
```

### Environment Setup
1. Set up MongoDB instance
2. Configure environment variables
3. Build and deploy services
4. Set up reverse proxy (nginx)
5. Configure SSL certificates

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests** if applicable
5. **Commit your changes**:
   ```bash
   git commit -m 'Add some amazing feature'
   ```
6. **Push to the branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add JSDoc comments for complex functions
- Follow the existing project structure

### Issues and Bug Reports

- Use GitHub Issues for bug reports and feature requests
- Provide detailed reproduction steps
- Include system information and logs
- Check existing issues before creating new ones

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

<div align="center">

[![GitHub Issues](https://img.shields.io/github/issues/Milad93R/chat-support-service?style=flat-square)](https://github.com/Milad93R/chat-support-service/issues)
[![GitHub Discussions](https://img.shields.io/github/discussions/Milad93R/chat-support-service?style=flat-square)](https://github.com/Milad93R/chat-support-service/discussions)

</div>

For support and questions:
- 📖 Check the [API documentation](http://localhost:3003/api)
- 📋 Review the [widget README](apps/web/widget/README.md)
- 🐳 Check [Docker setup guide](back/user-service/README.Docker.md)
- 🐛 Report bugs via [GitHub Issues](https://github.com/Milad93R/chat-support-service/issues)
- 💬 Join discussions in [GitHub Discussions](https://github.com/Milad93R/chat-support-service/discussions)

### Frequently Asked Questions

<details>
<summary>How do I embed the widget on my website?</summary>

See the [Chat Widget System](#-chat-widget-system) section for detailed instructions on embedding the standalone widget.

</details>

<details>
<summary>Can I customize the widget appearance?</summary>

Yes! The widget supports theme customization and you can modify the CSS in `apps/web/widget/styles.css`.

</details>

<details>
<summary>Is this production-ready?</summary>

The system includes production-ready features like Docker support, security configurations, and performance optimizations. However, please review and test thoroughly before deploying to production.

</details>

## 🔄 Recent Changes

- **Widget System**: Dual widget support (integrated/standalone)
- **CORS Support**: Enhanced CORS for file:// protocol
- **Bundle Optimization**: Improved webpack configuration
- **Admin Dashboard**: Real-time chat management interface
- **WebSocket Gateway**: Enhanced real-time communication
- **Docker Support**: Complete containerized development environment

---

<div align="center">


⭐ Star this repository if you find it helpful!

</div> 