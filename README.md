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
- For map style, rather than an image of geometries, you can represent the earth surface with a series of dots, raised based on (exsadurated) elavation. Here's [a tutorial with source code](https://www.youtube.com/watch?v=XaDQI1HmoOQ), and here's a [visually stunning](https://www.youtube.com/watch?v=3hgt_GrkAm0) example of it being done in a very performant manner (they downsampled a massive dataset on the earth's elevation using Python).

### tools
- For ways of visulaization information on maps, take inspiration (technically and visually) from [this react-three-fiber globe library](https://github.com/vasturiano/r3f-globe?tab=readme-ov-file), especially this [gallery of globes](https://vasturiano.github.io/r3f-globe/example/multiple-globes/).
- Digitizing a map image:
  - Open Source QGIS can [help](https://docs.qgis.org/3.40/en/docs/training_manual/forestry/map_georeferencing.html) you "georeference" a map image onto a digital map, so you can export it, say, as a [GeoJSON file](https://stackoverflow.com/questions/70455885/how-to-create-a-geojson-file-from-an-image-overlay)
  - [map-digitizer](https://github.com/mapstertech/map-digitizer?tab=readme-ov-file) is an open source tool, but the only partially works. If it's easy to get working again, it looks like exactly the tool I was hoping for.
  - [allmaps.org](https://allmaps.org/) is a tool for projecting map images over digital maps, and it's open source. They also have a big repository of map images (often historic) digitized.

### data sources
- Easy, open source download of variable resolution [GeoJSON countries](https://geojson-maps.kyd.au/)


### existing maps, timelines, and creators

#### Maps

##### Deep time (geology & climate)
- [EarthViewer](https://www.biointeractive.org/classroom-resources/earthviewer) is a globe that lets you explore where modern locations/countries existed on the earth's surface as far back as 540 Mya. It's the best tool I've found for seeing (the latest slice) of tectonic shifts. It's got this nice vertical timeline with the major geological eras and epochs labeled. It also lets you pull up line charts of specific properties over time, such as CO2 or temperature.

#### Space (ie beyond just the Earth globe)
- Amazing, raw threejs [3D solar system](https://github.com/SoumyaEXE/3d-Solar-System-ThreeJS), topped only by the much more detailed and scale-correct [NASA solar system (with satellites)](https://eyes.nasa.gov/apps/solar-system/)

##### Misc maps
- [Native Land](https://native-land.ca/maps/native-land) shows indigenous lands, globally. Amazing resource.

##### Population & cartograms
- Adam from Howtown made [this short video](https://www.youtube.com/shorts/S4qkMsPTtsE) where he sized countries/regions based on their population, from 10,000 BC into the future (UN projections). He made a hexagon for each million people. It's a neat proof of concept of being able to (roughly) get population data for all of recorded human history. Here's his description of how he did it: "I downloaded the population data from the UN and HYDE (via Our World in Data), brought them into QGIS and linked them to a world map. Then I used the Cartogram3 plugin to distort the countries so each country shape contained an area proportional to population. The result was a real mess - too many contacting borders and countries like Russia that were wildly different in size vs. population - which resulted in some tangled and stringy shapes. I modified the original map so the shapes were a bit blockier and simplified some of the borders - most notably I had to pull Russia over towards Europe. I then used Python to intersect the cartograms with a hexagonal grid (where the hexagons were sized differently for each year so that their area would contain 1 million people relative to the country sizes). The code said: shade in any hexagon that overlaps with land more than 50% - and pick the color based on the country who takes up the most of that area. Then I exported the result as an SVG, brought it into Adobe Illustrator where it was easier to count the hexagons and double check all the totals. I pulled that SVG in Adobe After Effects for animation. Some hexagon movements were key-framed manually, but I also used the Shatter effect (with a hexagonal shard shape scaled to match the base map) for some of the larger lifts."

##### Historical maps sorta similar to Time Map
- [OmniAtlas](https://omniatlas.com/) made a series of static images (with overlay annotations) for an incredible swath of history and geography, I think it may be the most comprehensive set of static map images on the web.
- [Globe of History](https://www.globeofhistory.com/) uses LLMs to turn Wikipedia into a 6,000 years of dots (points) on a 3D globe. Points are categorized most fundamentally into things like "wars", "battles", "philosophers", built from Wikipedia article categories like “Category:Sieges,” and “Category:Naval battles." The focus of the project seems very much around automatically transforming data (Wikipedia) into a big, explorable dataset of points. As UX designer and creator, Yam Sasson, puts it, he's trying to build "[a data factory](https://medium.muz.li/how-i-built-a-data-factory-for-6-000-years-of-history-04b0b76e0bce) for 6,000 years of history"
- [GeaCron](https://geacron.com/home-en/), a project that began in 2010 and went quiet in 2021, is the closest thing I've seen to an interactive map of civilizations over time (since 3000 BC), though mostly focused on the Eurasian continent. It seems aimed at setting up a serious business (eg it offers to sell its dataset just half a million dollars).

##### Animated maps (video)
- Animated map shows [how religion spread](https://www.youtube.com/watch?v=AvFl6UBZLv4) around the world by Business Insider (naturally)
- [History of the World: Every Year](https://www.youtube.com/watch?v=hzWwp9JM7Hw) by French creator Cottereau covers from 2500 BC to modern day. Lots of videos since 2500 BC: Timelapse of Every [Battle]() in History (that's on Wikipedia), [Europe](https://www.youtube.com/watch?v=UY9P0QSxlnI) every year, and more. They also have this clever idea of "assembling the world" by country from lowest to highest value on a statistics (eg fertility), which is a simple but great concept.
- [Ollie Bye](https://www.linkedin.com/in/ollie-bye-75a713272/) is the absolute *legend* behind his own YouTube [channel](https://www.youtube.com/@OllieBye/featured) with a dizzying amount of super detailed historical maps, including:
    - [The History of the World: Every Year](https://www.youtube.com/watch?v=-6Wu0Q7x5D0) based off this Google Doc of [events](https://docs.google.com/document/d/1_oJx72M75tuai2mo6yD13qqQB1g_auQxdXxG9u__u94/edit?tab=t.0).
    - [The Spread of Writing: Every Year](https://www.youtube.com/watch?v=eUpJ4yVCNrI)
    - [The Spread of Buddhism (500 BCE - 1200)](https://www.youtube.com/watch?v=SMvQtRtT4-I)
    - Narrated History of the World series, [beginning](https://www.youtube.com/watch?v=KIlj2sNlOJw) with humans in Africa, and with a timeline at the base of the map.

#### Non-maps

##### Timelines (importance over literal geography)
- UsefulCharts has an incredible [collection of timelines](https://usefulcharts.com/), from family trees to world religion family trees to historical states and societies. UsefulCharts is an interesting comparison because they committed (simplified?) completely to both static views, but also to not trying to represent geographic area or population size etc in the width of timeline elements, instead using very approximate sizes to represent the "importance" of the region.



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
