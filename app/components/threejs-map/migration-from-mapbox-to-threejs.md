# High level plan

Leave the map/ folder as is, and just build out threejs-map/ in parallel in ThreeJSMap.tsx, and update page.tsx to use the new that instead of Map.tsx.

We want to rely on react-three/fiber and @react-three/drei for controls. Installation note: "Fiber is compatible with React v18 and v19 and works with ReactDOM and React Native. Fiber is a React renderer, it must pair with a major version of React, just like react-dom, react-native, etc. @react-three/fiber@8 pairs with react@18, @react-three/fiber@9 pairs with react@19."

1. Basically, let's start by just perfectly reproducing the earth in earth-with-react-three-fiber repo (but stick with time-map's current react version, don't change that). DO NOT worry about adding any geometriecs or interaction at this point. Just a perfect reproduction, minus the default spinning behavior.
2. We already have basic interactive manipulation from drei, but we want to refine it a bit: ie have it zoom at a different speed based on how far/clsoe you are, prevent you from zooming into/through the globe (as is currently possible).
3. Then, we turn to the (hairy?) problem of adding the geographic regions to the map. No need to do anything fancy with the style, at this point, just basic colors as before is fine.
4. With geographic regions, we want to be sure they are interactive, ie hovering them updates global state, and global state updates which are highlighted. Also a tooltip.

# Background prep: understanding the fundamental of 3JS