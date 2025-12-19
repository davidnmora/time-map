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


# Resources

### inspiration
- Pinterest board for design [inspiration](https://www.pinterest.com/itsdavidmora/time-map/)

### tools
- Digitizing a map image:
  - Open Source QGIS can [help](https://docs.qgis.org/3.40/en/docs/training_manual/forestry/map_georeferencing.html) you "georeference" a map image onto a digital map, so you can export it, say, as a [GeoJSON file](https://stackoverflow.com/questions/70455885/how-to-create-a-geojson-file-from-an-image-overlay)
  - [map-digitizer](https://github.com/mapstertech/map-digitizer?tab=readme-ov-file) is an open source tool, but the only partially works. If it's easy to get working again, it looks like exactly the tool I was hoping for.
  - [mapbox-gl-draw](https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/)
  - [allmaps.org](https://allmaps.org/) is a tool for projecting map images over digital maps, and it's open source. They also have a big repository of map images (often historic) digitized.

### existing data, maps, and creators
- [OmniAtlas](https://omniatlas.com/) made a series of static images (with overlay annotations) for an incredible swath of history and geography, I think it may be the most comprehensive set of static map images on the web.
- UsefulCharts has an incredible [collection of timelines](https://usefulcharts.com/), from family trees to world religion family trees to historical states and societies. UsefulCharts is an interesting comparison because they committed (simplified?) completely to both static views, but also to not trying to represent geographic area or population size etc in the width of timeline elements, instead using very approximate sizes to represent the "importance" of the region.
- [Native Land](https://native-land.ca/maps/native-land) shows indigenous lands, globally. Amazing resource.
- *Population*: Adam from Howtown made [this short video](https://www.youtube.com/shorts/S4qkMsPTtsE) where he sized countries/regions based on their population, from 10,000 BC into the future (UN projections). He made a hexagon for each million people. It's a neat proof of concept of being able to (roughly) get population data for all of recorded human history. Here's his description of how he did it: "I downloaded the population data from the UN and HYDE (via Our World in Data), brought them into QGIS and linked them to a world map. Then I used the Cartogram3 plugin to distort the countries so each country shape contained an area proportional to population. The result was a real mess - too many contacting borders and countries like Russia that were wildly different in size vs. population - which resulted in some tangled and stringy shapes. I modified the original map so the shapes were a bit blockier and simplified some of the borders - most notably I had to pull Russia over towards Europe. I then used Python to intersect the cartograms with a hexagonal grid (where the hexagons were sized differently for each year so that their area would contain 1 million people relative to the country sizes). The code said: shade in any hexagon that overlaps with land more than 50% - and pick the color based on the country who takes up the most of that area. Then I exported the result as an SVG, brought it into Adobe Illustrator where it was easier to count the hexagons and double check all the totals. I pulled that SVG in Adobe After Effects for animation. Some hexagon movements were key-framed manually, but I also used the Shatter effect (with a hexagonal shard shape scaled to match the base map) for some of the larger lifts."
- [Globe of History](https://www.globeofhistory.com/) uses LLLms to turn Wikipedia into a 6,000 years of dots (points) on a 3D globe. Points are categorized most fundamentally into things like "wars", "battles", "philosophers", built from Wikipedia article categories like “Category:Sieges,” and “Category:Naval battles." The focus of the project seems very much around automatically transforming data (Wikipedia) into a big, explorable dataset of points. As UX designer and creator, Yam Sasson, puts it, he's trying to build "[a data factory](https://medium.muz.li/how-i-built-a-data-factory-for-6-000-years-of-history-04b0b76e0bce) for 6,000 years of history"
- [GeaCron](https://geacron.com/home-en/), a project that began in 2010 and went quiet in 2021, is the closest thing I've seen to an interactive map of civilizations over time (since 3000 BC), though mostly focused on the Eurasian continent. It seem aimed at seting up a serious buisness (eg it offers to sell its dataset just half a million dollars).
- Video-ish
    - Animated map shows [how religion spread](https://www.youtube.com/watch?v=AvFl6UBZLv4) around the world by Business Insider (naturally)
    - [Ollie Bye](https://www.linkedin.com/in/ollie-bye-75a713272/) is the absolute *legend* behind his own YouTube [channel](https://www.youtube.com/@OllieBye/featured) with a dizzying amount of super detailed historical maps, including:
        - [The History of the World: Every Year](https://www.youtube.com/watch?v=-6Wu0Q7x5D0) based off this Google Doc of [events](https://docs.google.com/document/d/1_oJx72M75tuai2mo6yD13qqQB1g_auQxdXxG9u__u94/edit?tab=t.0).
        - [The Spread of Writing: Every Year](https://www.youtube.com/watch?v=eUpJ4yVCNrI)
        - [The Spread of Buddhism (500 BCE - 1200)](https://www.youtube.com/watch?v=SMvQtRtT4-I)
        - Narrated History of the World series, [beginning](https://www.youtube.com/watch?v=KIlj2sNlOJw) with humans in Africa, and with a timeline at the base of the map.



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
