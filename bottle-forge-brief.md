Adapting a WebGL/Three.js application like FRAM3D from a picture frame generator into a procedural bottle generator is a highly achievable path. The existing architecture (React, TypeScript, Vite, and Three.js) provides the exact foundation needed for real-time 3D rendering, state management, and STL exporting.

To satisfy the constraint that aesthetic customizations must never break the functional lid mechanisms, the core architectural concept will be the **Zone System**. The bottle will be mathematically split into an immutable "Neck Zone" (where tolerances and threads live) and a fluid "Body Zone" (where shapes, textures, and labels are applied).

Here is the strategic breakdown for the new application.

### Product Requirements Document (PRD)

**Objective**
Provide a web-based, real-time 3D configuration tool that generates watertight, support-free, 3D-printable cylindrical bottles and matching lids.

**Core Features & Parameters**

* **Dimensional Controls:** Sliders for Inner/Outer Diameter, Overall Height, and Wall Thickness.
* **Lid Interface Toggle:**
* *Slip-on:* A friction-fit cap with a configurable tolerance gap (default ~0.15mm clearance).
* *Screw-on:* Auto-generated threads on both the bottle neck and the interior of the lid.


* **Aesthetic Customization (Restricted to Body Zone):**
* *Profiles:* Selectable 2D spline curves (e.g., straight cylinder, hourglass, convex, faceted) that dictate the bottle's silhouette.
* *Textures:* Procedural surface patterns like knurling, vertical ridges, or Voronoi.
* *Embossed Labels:* Custom text inputs that wrap seamlessly around the curvature of the bottle.



**Printability & Constraints**

* All generated geometry must be manifold (watertight).
* Overhangs, specifically on threads and heavy textures, must not exceed 45 degrees to ensure they can be printed without generated supports.

---

### Architecture Plan

**Tech Stack**

* **Framework:** React + Vite (inheriting from the FRAM3D setup).
* **State Management:** Zustand or React Context for fast parameter updates linked to the 3D canvas.
* **3D Engine:** Three.js.
* **Geometry Processing:** `three-bvh-csg` (Constructive Solid Geometry) to cleanly add embossed text and merge the Neck and Body zones without interior intersecting faces.
* **Export:** `STLExporter` from Three.js examples.

**The Zone System Implementation**

1. **Neck Zone (Functional):** Generated using strict programmatic vertices. Its height and outer diameter are fixed based on the user's base diameter choice. It handles either a smooth indented ring (slip-on) or the external thread geometry.
2. **Body Zone (Aesthetic):** Generated using `LatheGeometry`. A 2D spline path is swept 360 degrees. The top vertex of this spline is mathematically locked to the bottom radius of the Neck Zone to guarantee a perfect seam.

**Thread Generation (Best Practices & Approach)**
Generating 3D printable threads is notoriously tricky because standard triangular ISO threads have sharp roots that printers struggle with, and boolean cutting often results in broken web geometry.

* **Best Practice Profile:** Use an ACME or Trapezoidal thread profile. Flat crests and roots prevent the printer nozzle from dragging, and 45-degree flank angles eliminate the need for supports.
* **Clearance:** Hardcode a diametrical clearance of ~0.3mm to 0.4mm. The female thread (inside the lid) must be generated slightly larger than the male thread (bottle neck).
* **Algorithmic Approach:** Instead of using boolean subtracts (which can fail in Three.js), generate the thread procedurally. You plot vertices in a helix around a cylinder. Open-source gists for "Three.js ISO Metric Screw Thread" typically construct an array of vertices calculating `[x, y, z]` where `z` increases by the `pitch` per rotation, and `x, y` follow `sin`/`cos` of the radius. You can adapt this math to sweep a trapezoidal profile.
* **Chamfering Starts/Ends:** The thread geometry must taper into the cylinder wall at the very top and bottom of the rotation to prevent harsh overhangs on the first printed layer of the thread.

---

### Implementation Plan

**Phase 1: Project Skeleton & State**

1. Clone the FRAM3D repository.
2. Strip out the picture frame generation logic. Retain the UI layout, Three.js canvas setup, camera controls (OrbitControls), lighting, and the STL export function.
3. Implement the React state for the base parameters (Diameter, Height, Thickness).
4. Render two basic `CylinderGeometry` meshes: the Bottle Base and the Lid Base.

**Phase 2: The Zone System & Slip-On Mechanics**

1. Split the Bottle mesh into two stacked geometries: The Body and the Neck.
2. Implement the Slip-On logic. Programmatically set the Neck's outer diameter to `Base Diameter - Wall Thickness`. Set the Lid's inner hollow diameter to `Neck OD + 0.2mm` (tolerance).
3. Implement `three-bvh-csg` to union the Body and Neck into a single mesh so the exporter generates a clean, single-shell STL.

**Phase 3: The Thread Generator**

1. Write a custom geometry function `createThread(radius, pitch, rotations, profileType)`.
2. Generate the vertices by looping through the `rotations` and mapping a trapezoidal shape onto the helical path.
3. Apply this custom thread mesh to the outside of the Neck Zone.
4. Invert the normal generation and increase the radius by `0.35mm` to generate the internal female thread for the Lid.
5. Union the threads to their respective base bodies.

**Phase 4: Profiles & Procedural Textures**

1. Swap the Body Zone's `CylinderGeometry` for a `LatheGeometry`.
2. Create UI presets for "Shapes" that alter the Vector2 points fed into the Lathe (e.g., bulging the middle points for a barrel shape).
3. Implement Textures using vertex displacement. Subdivide the Body mesh heavily. Loop through its vertices and displace them outward using 3D Noise (like Simplex noise) or Sine waves for ridges. *Crucial:* Multiply the displacement intensity by a gradient that falls to `0` at the very top of the Body Zone, ensuring it seamlessly meets the smooth Neck Zone.

**Phase 5: Embossed Labels**

1. Load a font JSON and generate `TextGeometry`.
2. Write a bending function: iterate through the text's vertices, converting their flat Cartesian coordinates `(x, y, z)` into Cylindrical coordinates `(radius, theta, y)` based on the bottle's diameter at that specific height.
3. Use CSG to union the curved text mesh to the outside of the Body Zone.

**Phase 6: Quality Assurance & Export Polish**

1. Add a "Print Preview" mode that visually slices the model on the web canvas so users can verify the wall thickness.
2. Export test models and run them through PrusaSlicer/Cura to verify that the mesh is completely manifold and that the 45-degree rule holds true on the thread overhangs.
3. Expose a "Thread Tolerance" advanced slider, allowing users with less accurate FDM printers to loosen the lid fit if their first print binds up.