# Example: JWT Authentication Testing

This example shows how to use ModHeader to test JWT authentication without modifying your backend code.

## Scenario

You have a backend API that requires JWT authentication, and you want to test different endpoints without manually adding the Authorization header to each request.

## Setup

1. Start ModHeader proxy:
```bash
TARGET_URL=http://localhost:3000 npm start
```

2. Add JWT authentication rule:
```bash
curl -X POST http://localhost:8080/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add",
    "type": "request",
    "headers": {
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    }
  }'
```

3. Now all requests through the proxy will include the JWT token:
```bash
# This request will automatically include the Authorization header
curl http://localhost:8080/api/user/profile

# Test another protected endpoint
curl http://localhost:8080/api/admin/dashboard
```

## Testing with different tokens

```bash
# Get the rule ID
RULE_ID=$(curl -s http://localhost:8080/api/rules | jq -r '.data[0].id')

# Update with a different token
curl -X PUT http://localhost:8080/api/rules/$RULE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "headers": {
      "Authorization": "Bearer new-token-here"
    }
  }'
```

## Cleanup

```bash
# Remove the authentication rule
curl -X DELETE http://localhost:8080/api/rules/$RULE_ID
```
