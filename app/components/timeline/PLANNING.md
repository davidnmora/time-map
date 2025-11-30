Build it in two stages

# 1. Basic timeline with interaction

General attributes:
- Vertical timeline on the right side of the screen, overlaying the map, about 100 pixels wide.
- Year should be the smallest resolution, and the year labels should be on the left of the timeline line
- User interaction:
    - The selected year is marked with a horizontal line, and always sits at the dead center of the timeline
    - the user can scroll up and down, which shifts the timeline forward and backward in time (this updates the selected year)
    - the user can do the "zoom in/out" gesture, which zooms in or out on the timeline (we'll need to create two new URL params called `minYear` and `maxYear`, which should also filter what regions are passed into the Map.tsx component)
- Use d3-axis to render the timeline (as a separate sub component), maybe something vaguely like:
```js
import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";

const MARGIN = { top: 30, right: 30, bottom: 50, left: 50 };

type AxisBasicD3Props = {
  width: number;
  height: number;
};

export const AxisBasicD3 = ({ width, height }: AxisBasicD3Props) => {
  // Layout. The div size is set by the given props.
  // The bounds (=area inside the axis) is calculated by substracting the margins
  const axesRef = useRef(null);
  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  // X axis
  const xScale = useMemo(() => {
    return d3.scaleLinear().domain([0, 10]).range([0, boundsWidth]);
  }, [width]);

  // Y axis
  const yScale = useMemo(() => {
    return d3.scaleLinear().domain([0, 10]).range([boundsHeight, 0]);
  }, [height]);

  // Render the X and Y axis using d3.js, not react
  useEffect(() => {
    const svgElement = d3.select(axesRef.current);
    svgElement.selectAll("*").remove();
    const xAxisGenerator = d3.axisBottom(xScale);
    svgElement
      .append("g")
      .attr("transform", "translate(0," + boundsHeight + ")")
      .call(xAxisGenerator);

    const yAxisGenerator = d3.axisLeft(yScale);
    svgElement.append("g").call(yAxisGenerator);
  }, [xScale, yScale, boundsHeight]);

  return (
    <div>
      <svg width={width} height={height} style={{ display: "inline-block" }}>
        {/* Second is for the axes */}
        <g
          width={boundsWidth}
          height={boundsHeight}
          ref={axesRef}
          transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
        />
      </svg>
    </div>
  );
};
```


# 2. Add visualization of the regions over time

### component structure

Next, we want to add a thin, vertical strip for each region, corresponding to the timeRange of the region. About 3 pixels wide.

They should be their own sub component that's rendered alongside the timeline sub-component, within a parent. Both are equal height, and sit in columns next to each other.

I imagine component something like:
- `TimelineAndTimelineRegions.tsx`
- `Timeline.tsx`
- `TimelineRegions.tsx`
  - For each column we compute (call them `regionColumns`), `TimelineRegionColumn.tsx`


### Layout algorithm to produce the `regionColumns`

Generally speaking, we will place these vertical strips in non-overlapping columns just to the right of the timeline line. Our aim is to place the strips as close to the timeline line as possible, while avoiding overlap. When there's overlap, we look for the nearest (earliest/leftmost) column without an overlap, or add another column to the right if needed.

#### Examples

For example, imagine we have three regions:
- Region 1: [1900, 1950]
- Region 2: [1920, 1970] // overlaps with Region 1, so we put it in a new column to the right
- Region 3: [1940, 1990] // overlaps with Region 2, so we put it in a new column to the right

We would place them like this:

```
| Column 1 | Column 2 | Column 3 |
| Region 1 | Region 2 | Region 3 |
```

However let's tweak this example slightly so that we can demo playing a region back in an existing column to keep it maximally to the left. Say we have:

- Region 1: [1900, 1950] // added first, so it's in column 1
- Region 2: [1920, 1970] // overlaps with Region 1, so put it in a new column to the right
- Region 3: [1960, 1990] // try putting it in column 1 first, and since it doesn't overlap any of the regions there, we can add it there.
- Region 4: [1971, 2010] // Can't put it in the first column, because it with a region in column 1 (Region 3), but we can put it in the second column, because it doesn't overlap with any of the regions in column 2 (currently just Region 2).
- Region 5: [1972, 2010] // Can't put it in the first column, because it overlaps with a region we put in column 1, Region 3. Can't put it in the second column, because it overlaps with a region we put in column 2, Region 4. So we add a new, third column to the right.

Results in:

```
| Column 1 | Column 2 | Column 3 |
| Region 3 | Region 4 | 
| Region 1 | Region 2 | Region 5 |
```
The above table "stacks" the regions in columns where overlap won't happen. Then we can safely just render out each column as a separate sub-component, and we'll have a nice, non-overlapping layout.

#### Layout algorithm more formally

The layout algorithm should be:
1. Prep: Sort the regions by their timeRange start year, and begin rendering the earliest region first
2. For each region, place them in the earliest column without overlap with any of the regions in that column. ie try for column 1 first, then column 2, then column 3, adding a new column if necessary, etc.

Then we simply render each column, with each region as a vertical strip within it.