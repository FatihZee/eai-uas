# Base image
FROM node:20

# Buat workdir
WORKDIR /app

# Salin file
COPY package*.json ./
RUN npm install

COPY . .

# Ekspos port REST dan GraphQL
EXPOSE 3004 4004

# Jalankan dua server
CMD ["npm", "run", "dev:both"]