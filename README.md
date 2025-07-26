This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Local Environment

For development the application expects a `.env.local` file in the project root containing your MongoDB connection string. A sample connection string is shown below and matches the one used by the demo site:

```ini
MONGODB_URI=mongodb+srv://kmv9063:Ma1ya%40nk3@cluster0.b4vji2s.mongodb.net/sample_mflix?retryWrites=true&w=majority
```

Copy this into `.env.local` before running the dev server.

## Database Configuration

The project uses [Prisma](https://www.prisma.io/) with PostgreSQL. In production
it expects a connection to an **Azure PostgreSQL Flexible Server**. The database
connection string is read from the `DATABASE_URL` environment variable.

Create a `.env.production` file based on the provided template and set the
credentials for your server:

```bash
cp .env.production.example .env.production
# then edit .env.production with your production database credentials
```

Run migrations in production with:

```bash
npm run migrate
```

To create a new migration during development run:

```bash
npx prisma migrate dev --name <migration-name>
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Development

### Scripts

- `npm run dev` – start the dev server
- `npm run lint` – ESLint checks
- `npm run typecheck` – TypeScript type checking
- `npm run build` – production build
- `npm run test:e2e` – run Playwright smoke tests

### Routes

- `/` – Home (Live Now)
- `/scores`
- `/schedule`
- `/competitors`
- `/replays`
- `/map`
- `/shop`
- `/settings`

### Global State

The Zustand store is defined in `src/lib/state/useAppStore.ts` and exposes `currentEvent` and `userSession`.
