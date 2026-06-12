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

## Neon + Drizzle Quick Start

This project is scaffolded for Neon Postgres with Drizzle ORM.

1. Link the local project to Vercel if it is not linked yet:

```bash
vercel link
```

2. Add Neon from Vercel Marketplace:

```bash
vercel integration add neon
```

3. Pull the generated environment variables locally:

```bash
vercel env pull .env.local --yes
```

If you use an existing Neon project instead, copy `.env.example` to `.env.local` and set `DATABASE_URL`.

4. Push the schema and seed mock documents:

```bash
pnpm db:push
pnpm db:seed
```

5. Start the app and test the database connection:

```bash
pnpm dev
```

Open [http://localhost:3000/api/db/health](http://localhost:3000/api/db/health). A successful connection returns `{ "ok": true }`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
