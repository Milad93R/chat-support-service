# Chat Support Backend - Docker Development Setup

This setup provides a containerized development environment with hot reload capabilities.

## Services

- **API Service** (Port 3003): NestJS backend with hot reload
- **MongoDB** (Port 27017): Database
- **Mongo Express** (Port 8081): Database management UI

## Quick Start

1. **Start all services**:
   ```bash
   docker-compose up -d
   ```

2. **View logs**:
   ```bash
   # All services
   docker-compose logs -f
   
   # API service only
   docker-compose logs -f api
   
   # MongoDB only
   docker-compose logs -f mongodb
   ```

3. **Stop services**:
   ```bash
   docker-compose down
   ```

4. **Rebuild and restart**:
   ```bash
   docker-compose up --build -d
   ```

## Development Features

- **Hot Reload**: Code changes in `src/` directory automatically restart the server
- **Volume Mounting**: Source code is mounted for real-time development
- **Database Persistence**: MongoDB data persists between container restarts
- **Health Checks**: Services wait for dependencies to be healthy before starting

## Access Points

- **API**: http://localhost:3003
- **API Documentation**: http://localhost:3003/api (Swagger)
- **MongoDB**: mongodb://localhost:27017/chat-support
- **Mongo Express**: http://localhost:8081 (admin/admin123)

## Environment Configuration

The Docker setup uses `.env.docker` for environment variables:

```env
MONGODB_URI=mongodb://mongodb:27017/chat-support
PORT=3003
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-here
```

## Useful Commands

```bash
# Start in foreground (see logs)
docker-compose up

# Start in background
docker-compose up -d

# Rebuild specific service
docker-compose build api

# Execute commands in running container
docker-compose exec api npm run test

# Clean up everything (including volumes)
docker-compose down -v

# View container status
docker-compose ps

# Access MongoDB shell
docker-compose exec mongodb mongosh chat-support
```

## Development Workflow

1. Make code changes in `src/` directory
2. The API service automatically detects changes and restarts
3. Check logs with `docker-compose logs -f api`
4. Test endpoints at http://localhost:3003

## Troubleshooting

- **Port conflicts**: Make sure ports 3003, 27017, and 8081 are not in use
- **Permission issues**: Ensure Docker has proper permissions
- **MongoDB connection**: Check if MongoDB is healthy with `docker-compose ps`
- **Hot reload not working**: Verify volume mounts are correct

## Production Deployment

For production, use the regular `Dockerfile` instead of `Dockerfile.dev`:

```bash
docker build -t chat-support-api .
docker run -p 3003:3003 chat-support-api
``` 