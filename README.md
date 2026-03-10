# BOTTL3D

A web-based, real-time 3D bottle configurator that generates watertight, 3D-printable bottles and matching lids.

**Live Demo:** https://ziipo.github.io/BOTTL3D/

## Features

- Real-time 3D preview with OrbitControls
- Dimensional controls: diameter, height, wall thickness
- Lid types: slip-on or screw-on with auto-generated threads
- Body profiles: cylinder, barrel, hourglass, tapered, and more
- Surface textures: rings, grooves, knurling
- Embossed/engraved text labels that wrap around the bottle
- Export to STL for 3D printing

## Development

```bash
cd bottle-forge
npm install
npm run dev
```

## Tech Stack

- React 19 + Vite 7
- Three.js + React Three Fiber
- manifold-3d (CSG / boolean operations)
- Zustand (state management)
- Tailwind CSS v4
