FROM mysql:8.0

# Set environment variables
ENV MYSQL_ROOT_PASSWORD=root
ENV MYSQL_DATABASE=eai_user_service

# Copy initialization scripts
COPY sql-init/ /docker-entrypoint-initdb.d/

# Copy custom MySQL config (optional)
# COPY my.cnf /etc/mysql/conf.d/

# Expose port 3306
EXPOSE 3306

# Use default MySQL entrypoint