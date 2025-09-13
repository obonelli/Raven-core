# Raven-core 🐦

Main back-end in **Node.js + TypeScript + Express**, designed as the stable core of our platform.

## 🚀 Features
- REST API with Express
- Swagger UI with dark theme (Dracula)
- TypeScript configuration (ES2022)
- Integrated logger
- Modular architecture (controllers, services, repositories)

## 📂 Structure
```
src/
 ├── config/        # Configuration (env, logger, dynamo)
 ├── controllers/   # API controllers
 ├── middlewares/   # Global middlewares
 ├── models/        # Data models
 ├── repositories/  # Data access layer
 ├── routes/        # API endpoints
 ├── services/      # Business logic
 └── tests/         # Unit tests
```

## 🛠️ Scripts
```bash
# development
npm run dev

# build for production
npm run build

# run build
npm start

# run tests
npm test
```

## ⚙️ Configuration
Environment variables in `.env` file:
```env
PORT=3000
NODE_ENV=development
```

## 📖 Documentation
Full technical documentation is maintained in Confluence:  
👉 [Raven-core Confluence](https://bonellipersonal.atlassian.net/wiki/spaces/RAVEN/overview)

