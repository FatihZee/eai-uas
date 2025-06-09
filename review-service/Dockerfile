FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3004 4004

CMD ["npm", "run", "dev:both"]