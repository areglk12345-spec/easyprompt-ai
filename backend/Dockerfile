FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose port 8080 for Railway Edge Proxy
EXPOSE 8080

# Use shell form to allow environment variable expansion (useful for Railway)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
