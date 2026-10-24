# syntax=docker/dockerfile:1

# ---------- build ----------
FROM node:24-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies before copying the source so this layer is reusable.
COPY package.json package-lock.json ./
RUN npm ci

# The API origin is baked in at build time: the browser (not the container)
# calls it, so it must be the URL published on the host.
ARG VITE_API_URL=http://localhost:8000/api
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# ---------- runtime ----------
FROM nginx:alpine AS runtime

COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
COPY docker.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
