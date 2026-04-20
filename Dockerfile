FROM node:20-alpine

WORKDIR /app

# Copy only dependencies files first
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (cached if package.json unchanged)
RUN npm install
RUN npx prisma generate

# Copy remaining source code
COPY . .

# Build app
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
