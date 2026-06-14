# Setup and Run Instructions

Welcome to the **GenWorkAI** project. Follow the instructions below to get your local development environment up and running after cloning or pulling the repository.

## Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)
- **Git**

## 1. Clone the Repository

If you haven't already cloned the repository, do so using Git:

```bash
git clone <repository_url>
cd genworkai
```

## 2. Install Dependencies

This project uses an npm workspaces / Turborepo structure. You can install all dependencies for both the `web` app and the packages from the root directory.

Run the following command in the root folder (`genworkai`):

```bash
npm install
```

This will automatically install and link the required packages for all applications inside the `apps` and `packages` folders.

## 3. Environment Variables

Before running the application, you need to set up your environment variables. 
The web application requires a `.env.local` file inside the `apps/web` directory.

1. Create a `.env.local` file:
```bash
# Inside apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
# Add any other required backend or database variables here
```

*(Note: Ask your team for the necessary environment keys if you do not have them.)*

## 4. Run the Development Server

To start the development server for the entire monorepo, run the following command from the root directory:

```bash
npm run dev
```

This will leverage Turborepo to start the web application (and any other internal packages) simultaneously. 

The web application should now be running. Open [http://localhost:3000](http://localhost:3000) in your browser to view it.

## 5. Other Useful Commands

- **Build the project**: 
  ```bash
  npm run build
  ```
  *(Compiles the application for production deployment)*

- **Linting**:
  ```bash
  npm run lint
  ```
  *(Checks for code quality and style issues)*

## Troubleshooting
- If you encounter an `ENOSPC` error (No space left on device) while running `npm run dev`, you may need to clear your temporary files or increase your disk storage capacity.
- If dependency errors occur, try deleting the `node_modules` folders and running `npm cache clean --force` followed by `npm install` again.
