FROM nginx:alpine

# Copy static files ke nginx
COPY views/ /usr/share/nginx/html/

# Copy custom nginx config (optional)
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]