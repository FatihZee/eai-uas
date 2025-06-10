FROM node:18-alpine

WORKDIR /app

# Copy root package.json first
COPY package*.json ./
RUN npm install

# Copy all services
COPY . .

# Install dependencies for each service
RUN cd user-service && npm install
RUN cd menu-service && npm install  
RUN cd order-service && npm install
RUN cd review-service && npm install
RUN cd payment-service && npm install

# Expose all ports
EXPOSE 3001 3002 3003 3004 3005 4001 4002 4003 4004 4005

# Use concurrently to run all services
CMD ["npm", "run", "dev"]