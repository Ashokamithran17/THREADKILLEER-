FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency specifications and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir psycopg2-binary==2.9.9

# Copy backend codebase
COPY . .

# Set PYTHONPATH environment variable to resolve modules
ENV PYTHONPATH=/app

# Expose FastAPI port
EXPOSE 8000

# Run migrations/seed then start Uvicorn
CMD ["sh", "-c", "python database/seed_db.py && uvicorn main:app --host 0.0.0.0 --port 8000"]
