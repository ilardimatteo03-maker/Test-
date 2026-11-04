# Service de réservation TAXI PRO
# docker build -t taxi-pro-backend taxi-pro/backend
# docker run -p 8787:8787 --env-file .env -v taxipro-data:/app/data taxi-pro-backend
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8787 DATA_DIR=/app/data
COPY package.json ./
COPY src ./src
RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:8787/health || exit 1
CMD ["node", "src/server.js"]
