# Base image
FROM node:20

# Buat workdir
WORKDIR /app

# Salin file
COPY package*.json ./
RUN npm install

COPY . .

# Ekspos port REST dan GraphQL
EXPOSE 3001 4001

# Jalankan dua server
CMD ["npm", "run", "dev:both"]
