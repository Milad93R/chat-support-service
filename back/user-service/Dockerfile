# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Install Python and build dependencies
RUN apk add --no-cache python3 make g++ gcc

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install Python and build dependencies
RUN apk add --no-cache python3 make g++ gcc

COPY package*.json ./
RUN npm install --only=production

# Copy built application from build stage
COPY --from=build /app/dist ./dist

EXPOSE 3003

CMD ["npm", "run", "start:prod"] 