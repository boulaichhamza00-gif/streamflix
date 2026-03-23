FROM node:18-slim

# Install FFmpeg and dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Create streams directory
RUN mkdir -p streams

EXPOSE 5000

CMD ["npm", "start"]
