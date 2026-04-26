## Calm sound layers - vibe coded ambient audio mixer

- Browser-based ambient sound mixer. Stack rain, ocean, crickets, ambient music layers, and more as independent layers with per-track volume
- Seamless looping without harsh cuts, dual HTMLAudio players per track with timed crossfades before each loop boundary
- Shareable/bookmarkable mixes via query string: which tracks are playing and each volume level sync to the URL
- Hydration from the URL on load so shared links resume the same soundscape; optional “Play all” for the visible subset
- Night theme toggle for dark UI styling tuned for evening use and long sessions
- Built-in debug mode to surface app state and playback diagnostics (add debug=true to URL)
- Built with Next.js App Router, React 19, TypeScript, Tailwind CSS
- Unit tests for button visibilty logic and URL-state behavior with Jest + React Testing Library

deployed at https://ambient-mixer-xi.vercel.app

<img width="3410" height="2104" alt="image" src="https://github.com/user-attachments/assets/338df161-907a-4e2a-a343-485c834157d9" />

<img width="3420" height="2130" alt="image" src="https://github.com/user-attachments/assets/eb7cb44e-fc8f-46e8-944e-892933ea4b67" />


---

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
