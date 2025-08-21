# Stage-1 : Build the React app
FROM node:22-alpine AS build

WORKDIR /frontend
COPY package*.json ./

# pass env var as ARG
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm install
COPY . .
RUN npm run build

# Stage-2 : Serve using nginx
FROM nginx:alpine

# Copy build output to nginx folder
COPY --from=build /frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

