# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


Summary List (For Reference)
  (Production Dependencies)

    1. react-router-dom
    2. framer-motion
    3. lucide-react
    4. @radix-ui/react-avatar
    5. @radix-ui/react-label
    6. @radix-ui/react-radio-group
    7. @radix-ui/react-select
    8. clsx
    9. tailwind-merge
    10. class-variance-authority

    npm install react-router-dom framer-motion lucide-react @radix-ui/react-avatar @radix-ui/react-label @radix-ui/react-radio-group @radix-ui/react-select clsx tailwind-merge class-variance-authority && npm install -D tailwindcss postcss autoprefixer

(Development Dependencies)

    1. tailwindcss
    2. postcss
    3. autoprefixer

    npx tailwindcss init -p


## Environment variables

The frontend requires the following Vite environment variables before deploying to Vercel or another production host:

- `VITE_API_URL` - the backend API base URL
- `VITE_GOOGLE_CLIENT_ID` - the Google OAuth client ID used by the Google sign-in button

Example values belong in `frontend/.env.example` and `frontend/.env.production` when building the app for production.