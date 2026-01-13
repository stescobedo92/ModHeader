# Example: Cache Bypass Testing

This example demonstrates how to bypass cache headers for testing purposes.

## Scenario

You're testing an API that uses aggressive caching, and you want to ensure you're always getting fresh data without waiting for cache expiration.

## Setup

1. Start ModHeader proxy:
```bash
TARGET_URL=http://localhost:3000 npm start
```

2. Add cache bypass rules:
```bash
# Add no-cache headers to requests
curl -X POST http://localhost:8080/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add",
    "type": "request",
    "headers": {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  }'

# Remove cache headers from responses
curl -X POST http://localhost:8080/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "action": "remove",
    "type": "response",
    "headers": ["cache-control", "etag", "expires"]
  }'
```

3. Test the endpoint:
```bash
# All requests will bypass cache
curl -v http://localhost:8080/api/data
```

## Verify cache headers

```bash
# Check what headers are being sent
curl -v http://localhost:8080/api/data 2>&1 | grep -i cache
```
