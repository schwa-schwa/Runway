#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Seed default challenges
echo "Seeding default challenges..."
python manage.py seed_challenges

# Execute the main command (passed as arguments to this script)
echo "Starting server..."
exec "$@"
