# Time Map

A tool for exploring geographic data over time.

Deployed to [https://the-time-map.vercel.app](https://the-time-map.vercel.app).

# Understanding the data structure

### Core unit: `Time Bound Geographic Region`

The main unit of data is a `TimeBoundGeographicRegion`, specifying a geographic region or regions that existed in a specific period of time. It consists of 
- a `timeRange`
- a set of `geographicRegions` (ie the literal geometries to be shown on the map)
- `metadata` (e.g. a `title`, `description`, `color`, etc.)

For example, a `TimeBoundGeographicRegion` might describe a set of regions in the British Isles under Roman rule, with a `timeRange` of [43 AD, 410 AD] and a set of `geographicRegions` that include the regions of Britain, Scotland, and Wales under Roman rule during that period. The `metadata` could include any additional information or media we want to display for this region.

### Grouping: `Time Bound Geographic Region Group`

Given the nested nature of data (e.g. a region in Britain is part of the larger Roman Empire), we can group `TimeBoundGeographicRegion`s into `TimeBoundGeographicRegionGroup`s, which have their own `metadata`. It's highly composable: Such a grouping can contain both `TimeBoundGeographicRegion`s as well as *other* `TimeBoundGeographicRegionGroup`s.

See `app/data/types.ts` for the precise definitions of the data structures.

# Development

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
