# [SIMPLER PLAN] Simplest possible layout algorithm to prevent overlap of regions in the timeline: every region gets its own "column" and no column is ever reused.

The concept is simple:
- for each new region
- just place it to the right of the last, right-most region
  - we don't necessarily need to keep track of what's "in" each column (or have a column abstraction, unless its needed), we could just keep a running record of how far right we've filled up with regions, and then add the next region on the x-axis to the right the most-right most thing (could be the right most thing at any point in time, even if its no longer overlapping time-wise with the next region).

This is the most naive way to prevent overlap in the vertical dimension (and in the horizontal, too, to point out the obvious). Let's start here before we get more fancy-pantsy.


# [ORIGINAL PLAN, MORE COMPLEX] Layout algorithm to produce the `regionColumns`

Generally speaking, we will place these vertical strips in non-overlapping columns just to the right of the timeline line. Our aim is to place the strips as close to the timeline line as possible, while avoiding overlap. When there's overlap, we look for the nearest (earliest/leftmost) column without an overlap, or add another column to the right if needed.

## Added complexity: width of region strips

Currently we're encoding things like geographic region area as the width of the vertical strip. This creates a more complex potential algorithm than the one below, because we need to consider the width of the strip when deciding where to place the regions.

Perhaps the the way forward is to move away from geometric, box-y strips and into a more flow-y stream graph approach (curved stacked area charts). Could be more aesthetically beautiful, and also move away from the rectilinear precision of rectangles, and be more suggestive of the approximate/simplifying nature of the chart.

## Examples

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

## Layout algorithm more formally

The layout algorithm should be:
1. Prep: Sort the regions by their timeRange start year, and begin rendering the earliest region first
2. For each region, place them in the earliest column without overlap with any of the regions in that column. ie try for column 1 first, then column 2, then column 3, adding a new column if necessary, etc.

Then we simply render each column, with each region as a vertical strip within it.