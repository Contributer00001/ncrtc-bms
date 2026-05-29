#!/bin/bash

echo "Waiting for database to be ready..."

# Keep trying to connect until it works
while ! python3 -c "
import psycopg2, os
psycopg2.connect(os.getenv('DATABASE_URL'))
" 2>/dev/null; do
  echo "Database not ready yet — waiting 2 seconds..."
  sleep 2
done

echo "Database is ready!"

echo "Running seed script..."
python seed/seed.py

echo "Starting FastAPI server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
