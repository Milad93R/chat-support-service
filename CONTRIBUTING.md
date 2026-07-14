# Contributing

Open an issue before a large change so the approach can be agreed first. Keep pull requests focused and include tests for behavior changes.

Before submitting:

```bash
cd apps/web && npm ci && npm run build
cd ../../back/user-service && npm ci && npm run build && npm test -- --runInBand
```

Do not commit credentials, generated build output, or local environment files.
