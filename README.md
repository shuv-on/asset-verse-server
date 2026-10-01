# AssetVerse Server

Backend API for the AssetVerse corporate asset management platform.

AssetVerse helps organizations manage employee asset allocation, approvals, returns, and HR-driven inventory workflows with a secure and scalable Node.js API.

## Live Links

- API: https://asset-verse-server.vercel.app
- Client app: https://github.com/shuv-on/asset-verse-client

## Features

- Secure JWT-based authentication
- Role-aware user management
- Asset creation, update, delete, search, and filtering
- Request submission and approval workflows
- Employee and HR dashboard support
- Stock tracking and automatic quantity updates
- Payment intent creation for subscription/package upgrades
- MongoDB-based persistence with flexible querying
- CORS-enabled API for frontend integration

## Tech Stack

- Node.js
- Express.js
- MongoDB Atlas / MongoDB Driver
- JWT
- Stripe
- CORS
- Dotenv

## Project Structure

```text
asset-verse-server/
├── index.js
├── package.json
├── .env
├── .gitignore
├── README.md
├── mongodb/
└── node_modules/
```

## Prerequisites

Before running the project, make sure you have the following installed:

- Node.js 18+
- npm
- Access to a MongoDB Atlas cluster or a local MongoDB instance

## Installation

1. Clone the repository:

```bash
git clone https://github.com/shuv-on/asset-verse-server.git
cd asset-verse-server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory and add your environment variables:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/assetVerse?retryWrites=true&w=majority
DB_USER=<your_db_user>
DB_PASS=<your_db_password>
ACCESS_TOKEN_SECRET=<your_jwt_secret>
STRIPE_SECRET_KEY=<your_stripe_secret_key>
```

## Run the Project

### Start the server

```bash
npm start
```

### Run in development mode

```bash
npm run dev
```

## Available Scripts

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

## API Overview

The backend exposes endpoints for:

- User authentication and profile management
- Asset CRUD operations
- Request handling for employees and HR
- Dashboard statistics
- Payment intent creation and records

## Notes

- The server runs on port `5000` by default.
- MongoDB connection details should be stored in `.env` and not committed to source control.
- For production deployment, configure secure environment variables and use a managed MongoDB and Stripe setup.

## Author

Built for AssetVerse by Shuvon.

## License

This project is licensed under the ISC License.