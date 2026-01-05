FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for tsx)
RUN npm ci

# Copy source code
COPY . .

# Expose port for SSE transport
EXPOSE 3100

# Start MCP server
CMD ["npm", "start"]
