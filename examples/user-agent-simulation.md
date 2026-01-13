# Example: User-Agent Simulation

This example shows how to simulate different types of clients by modifying the User-Agent header.

## Scenario

You want to test how your API responds to different types of clients (mobile browsers, desktop browsers, bots, etc.) without actually using those devices.

## Setup

1. Start ModHeader proxy:
```bash
TARGET_URL=http://localhost:3000 npm start
```

## Simulate Mobile Browser (iPhone)

```bash
curl -X POST http://localhost:8080/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "action": "modify",
    "type": "request",
    "headers": {
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
    }
  }'

# Test endpoint
curl http://localhost:8080/api/content
```

## Simulate Desktop Browser (Chrome)

```bash
# Get the current rule ID
RULE_ID=$(curl -s http://localhost:8080/api/rules | jq -r '.data[0].id')

# Update to Chrome desktop
curl -X PUT http://localhost:8080/api/rules/$RULE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "headers": {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  }'

# Test endpoint
curl http://localhost:8080/api/content
```

## Simulate Googlebot

```bash
curl -X PUT http://localhost:8080/api/rules/$RULE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "headers": {
      "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    }
  }'

# Test endpoint
curl http://localhost:8080/api/content
```

## Testing Multiple User Agents

Create a script to test multiple user agents:

```bash
#!/bin/bash

USER_AGENTS=(
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0"
  "Mozilla/5.0 (compatible; Googlebot/2.1)"
)

RULE_ID=$(curl -s http://localhost:8080/api/rules | jq -r '.data[0].id')

for UA in "${USER_AGENTS[@]}"; do
  echo "Testing with: $UA"
  
  curl -X PUT http://localhost:8080/api/rules/$RULE_ID \
    -H "Content-Type: application/json" \
    -d "{\"headers\": {\"user-agent\": \"$UA\"}}"
  
  curl -s http://localhost:8080/api/content | jq '.'
  echo "---"
done
```
