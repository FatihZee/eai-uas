# user-service/Dockerfile

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose ports (REST and GraphQL)
EXPOSE 3001 4001

# Start both REST and GraphQL servers
CMD ["npm", "run", "dev:both"]
