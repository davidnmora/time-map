Main sequences of work

# 1. Get basic map component features / infra in

## Map component

Rename App.tsx to Map.tsx and make it the high level map component that follows strict seperation of conerns. It should not leak its own abstractions into the parent component, nor should it worry about the parent component's state or implementation details.

It should take in the following props:
- center: [number, number]
- zoom: number
- style: string
- accessToken: string
- onPositionUpdated which should be called when the user pans or zooms the map and passes the new center and zoom as arguments
- geographicRegions: an array of GeoJSON.FeatureCollection objects or something (we'll have to design it to work smoothly with our data structure as defined below) that enables us to add a polygon like:

```js
mapRef.current.addSource('maine', {
    type: 'geojson',
    data: {
        type: 'Feature',
        geometry: {
        type: 'Polygon',
        // These coordinates outline Maine.
        coordinates: [
            [
            [-67.13734, 45.13745],
            [-66.96466, 44.8097],
            [-68.03252, 44.3252],
            [-69.06, 43.98],
            [-70.11617, 43.68405],
            [-70.64573, 43.09008],
            [-70.75102, 43.08003],
            [-70.79761, 43.21973],
            [-70.98176, 43.36789],
            [-70.94416, 43.46633],
            [-71.08482, 45.30524],
            [-70.66002, 45.46022],
            [-70.30495, 45.91479],
            [-70.00014, 46.69317],
            [-69.23708, 47.44777],
            [-68.90478, 47.18479],
            [-68.2343, 47.35462],
            [-67.79035, 47.06624],
            [-67.79141, 45.70258],
            [-67.13734, 45.13745]
            ]
        ]
        }
    }
```
    
It should then handle:
- transitioning smoothly two different zooms and centers
- adding and removing polygons
- (lets assume nothing else is going to be dynamically updated, eg the style etc remains the same)


## General app state

The URL is the central source of truth for the app state. Use query params.

For now, it should hold
- zoom
- center
- year (YYYY)

We should keep the URL up to date. 

We also want a nice set of hooks / functions that makes it easy to both read and update the URL. eg

 `const { zoom, center, year } = useURLState()` and 
 
 `setURLState({ zoom: 10, center: [0, 0], year: 2020 })` 
 
 where the setting properties are optional and will only update the URL if they are provided.



# 2. Plan data structures for composing time periods & geographies

The big picture aim of this app is to let you explore geographic data over time. The map displays a moment in time, there will eventually be a timeline to show things over time.

Generally speaking, we will want to be able to show geographies that correspond to a specific moment in time (or region in time, eventually). The data structure should be designed to make this easy to specify and to compose.

## General data structure (proposal)

First, some basic types:

```ts
type Metadata = {
    id: string,
    title: string,
    description: string,
    color?: string,
}

 // I imagine we can use negative numbers to represent BC
 // null means "to present" (ie not bounded by a year)
type TimeRange = [number, number | null];

type GeographicRegion = GeoJSON.FeatureCollection; // or something similar
```

Here's the base unit used to describe a geographic region that existed in some period of time:

```ts
type TimeBoundGeographicRegion = {
    timeRange: TimeRange,
    geographicRegions: GeographicRegion[],
    metadata: Metadata,
}
```

We then can group those `TimeBoundGeographicRegion`s into `TimeBoundGeographicRegionGroup`s, both of which can be further grouped into even more `TimeBoundGeographicRegionGroup`. 

For a pratcical example, imagine the Roman Empire: individual regions, eg Britain, might have been under their control for specific periods, but we want to group them all into the larger entity of the Roman Empire.

```ts
type TimeBoundGeographicRegionGroup = {
    children: (TimeBoundGeographicRegion | TimeBoundGeographicRegionGroup)[],
    metadata: Metadata
}
```



# 3. Create some actual data using all this

## Hardcode some actual data into the app

We can programtically generate `TimeBoundGeographicRegion`s from `app/data/us-states.json` and `app/data/date-us-states-were-founded.json` and then a group of those two as a `TimeBoundGeographicRegionGroup` titled "United States".

## Update the map to display the data

### a. create an input that lets you chose the current year and update the URL with it

A basic range slider between the min and max years of the data, at the top of the page (make its own component, instantiate in the parent, NOT in the map component).

### b. update the map to handle the geography data

Basically, in the parent component, filter the data to only include geographies whose time region overlaps with the current year.

Mapbox needs to add and remove the polygons as the data changes, as in this generic example:

```js
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxExample = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiZGF2aWRubW9yYSIsImEiOiJjanQ2NGt2eXYwOTd3NDlzMnF4NnBscWZjIn0.acsLJCvFw9LAVbhFVIm7yQ';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      config: {
        basemap: {
          theme: 'monochrome'
        }
      },
      center: [-68.137343, 45.137451],
      zoom: 5
    });

    mapRef.current.on('load', () => {
      mapRef.current.addSource('maine', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            // These coordinates outline Maine.
            coordinates: [
              [
                [-67.13734, 45.13745],
                [-66.96466, 44.8097],
                [-68.03252, 44.3252],
                [-69.06, 43.98],
                [-70.11617, 43.68405],
                [-70.64573, 43.09008],
                [-70.75102, 43.08003],
                [-70.79761, 43.21973],
                [-70.98176, 43.36789],
                [-70.94416, 43.46633],
                [-71.08482, 45.30524],
                [-70.66002, 45.46022],
                [-70.30495, 45.91479],
                [-70.00014, 46.69317],
                [-69.23708, 47.44777],
                [-68.90478, 47.18479],
                [-68.2343, 47.35462],
                [-67.79035, 47.06624],
                [-67.79141, 45.70258],
                [-67.13734, 45.13745]
              ]
            ]
          }
        }
      });

      mapRef.current.addLayer({
        id: 'maine',
        type: 'fill',
        source: 'maine',
        layout: {},
        paint: {
          'fill-color': '#0080ff',
          'fill-opacity': 0.5
        }
      });

      mapRef.current.addLayer({
        id: 'outline',
        type: 'line',
        source: 'maine',
        layout: {},
        paint: {
          'line-color': '#000',
          'line-width': 3
        }
      });
    });
  }, []);

  return <div id="map" ref={mapContainerRef} style={{ height: '100%' }} />;
};

export default MapboxExample;
```