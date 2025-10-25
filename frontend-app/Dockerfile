# ---------- Stage 1: Build Angular ----------
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# ---------- Stage 2: Serve with nginx ----------
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
# replace 'frontend-app' with your actual dist folder name (see step 3)
COPY --from=build /app/dist/frontend-app ./
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
