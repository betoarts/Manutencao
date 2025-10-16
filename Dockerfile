# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock* pnpm-lock.yaml* ./

# Conditionally install pnpm if its lock file is present
RUN if [ -f pnpm-lock.yaml ]; then npm install -g pnpm; fi

# Install dependencies based on the lock file present
RUN \
  if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  else npm install --legacy-peer-deps; \
  fi

COPY . .

# Declare build arguments for Supabase environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Make them available as environment variables during the build process
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build the React app for production
# Use 'npm run build' or 'yarn build' or 'pnpm build' based on your package manager
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]