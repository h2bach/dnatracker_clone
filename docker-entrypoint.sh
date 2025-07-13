#!/bin/bash

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p /app/uploads
mkdir -p /app/tmp
mkdir -p /app/db
mkdir -p /app/backup
mkdir -p /app/eslogs

# Set proper permissions
chmod 777 /app/uploads
chmod 777 /app/tmp
chmod 755 /app/db
chmod 755 /app/backup
chmod 755 /app/eslogs

echo "Directories created and permissions set."

# Wait for services to be ready
echo "Waiting for MongoDB and Elasticsearch to be ready..."
sleep 5

# Check if MongoDB is ready
while ! curl -f http://mongodb:27017/ >/dev/null 2>&1; do
    echo "Waiting for MongoDB..."
    sleep 5
done

# Check if Elasticsearch is ready
while ! curl -f http://elasticsearch:9200/_cluster/health >/dev/null 2>&1; do
    echo "Waiting for Elasticsearch..."
    sleep 5
done

echo "All services are ready. Starting DNA Tracker..."

# Start the application
exec node dna-tracker.js
