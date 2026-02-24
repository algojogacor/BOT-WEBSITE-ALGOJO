FROM node:20-bookworm

# 1. Install sistem dependencies
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    imagemagick \
    webp \
    python3 \
    python3-pip \
    chromium \
    --no-install-recommends && \
    apt-get upgrade -y && \
    rm -rf /var/lib/apt/lists/*

# 2. Install Python library
RUN pip3 install pillow --break-system-packages

# 3. Set working directory
WORKDIR /app

# 4. PERBAIKAN: Copy package.json dari ROOT (folder utama), BUKAN dari commands
COPY package*.json ./

# 5. Install Node.js dependencies
# Menggunakan --omit=dev agar lebih ringan dan cepat
RUN npm install --omit=dev

# 6. Copy semua file bot
COPY . .

# 7. Buat direktori penting (pastikan session ada agar tidak minta scan ulang terus)
RUN mkdir -p session temp helpers

# Expose port untuk health check Koyeb/Railway
EXPOSE 3000

# 8. Jalankan bot
CMD ["node", "index.js"]
