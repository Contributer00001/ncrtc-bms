#!/bin/bash

echo "Waiting for database and seed to complete..."

# Wait for vehicles table to have data (means seed is done)
while true; do
  COUNT=$(python3 -c "
import psycopg2, os
try:
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) FROM vehicles')
    print(cur.fetchone()[0])
    conn.close()
except:
    print(0)
" 2>/dev/null)

  if [ "$COUNT" -gt "0" ]; then
    echo "Seed complete — $COUNT vehicles found. Starting tick script..."
    break
  fi

  echo "Waiting for seed to finish..."
  sleep 3
done

python seed/tick.py
