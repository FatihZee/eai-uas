# Base image
FROM node:20

# Buat workdir
WORKDIR /app

# Salin file
COPY package*.json ./
RUN npm install

COPY . .

# Ekspos port REST dan GraphQL
EXPOSE 3002 4002

# Jalankan dua server
CMD ["npm", "run", "dev:both"]
