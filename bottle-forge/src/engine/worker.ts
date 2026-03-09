import Module from 'manifold-3d';
import type { ManifoldToplevel } from 'manifold-3d';
import type { WorkerMessage, WorkerResponse, BottleParams, ResultMessage } from '../types/bottle';
import { generateBottle } from './bottleGenerator';
import { generateCrossSectionSVG } from './crossSectionDebug';
import { createZipArchive } from './zipWriter';

let wasm: ManifoldToplevel | null = null;

/**
 * Initialize the Manifold WASM module.
 */
async function initWasm(): Promise<ManifoldToplevel> {
  if (wasm) return wasm;

  wasm = await Module();
  wasm.setup();

  return wasm;
}

/**
 * Handle incoming messages from the main thread.
 */
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  if (message.type === 'generate') {
    await handleGenerate(message.params);
  } else if (message.type === 'cross-section') {
    await handleCrossSection(message.params);
  }
};

/**
 * Generate bottle + lid geometry and send results back.
 */
async function handleGenerate(params: BottleParams): Promise<void> {
  try {
    sendProgress('Initializing...', 10);
    const manifoldModule = await initWasm();

    sendProgress('Generating bottle geometry...', 30);
    const result = generateBottle(manifoldModule, params);

    sendProgress('Preparing mesh data...', 60);

    // Extract bottle mesh data
    const bottleMesh = result.bottleMesh;
    const bottlePositions = new Float32Array(bottleMesh.numVert * 3);
    const bottleNormals = new Float32Array(bottleMesh.numVert * 3);
    const bottleIndices = new Uint32Array(bottleMesh.numTri * 3);

    for (let i = 0; i < bottleMesh.numVert; i++) {
      const pos = bottleMesh.position(i);
      bottlePositions[i * 3] = pos[0];
      bottlePositions[i * 3 + 1] = pos[1];
      bottlePositions[i * 3 + 2] = pos[2];
    }
    for (let i = 0; i < bottleMesh.numTri; i++) {
      const verts = bottleMesh.verts(i);
      bottleIndices[i * 3] = verts[0];
      bottleIndices[i * 3 + 1] = verts[1];
      bottleIndices[i * 3 + 2] = verts[2];
    }
    computeNormals(bottlePositions, bottleIndices, bottleNormals);

    // Extract lid mesh data
    const lidMesh = result.lidMesh;
    const lidPositions = new Float32Array(lidMesh.numVert * 3);
    const lidNormals = new Float32Array(lidMesh.numVert * 3);
    const lidIndices = new Uint32Array(lidMesh.numTri * 3);

    for (let i = 0; i < lidMesh.numVert; i++) {
      const pos = lidMesh.position(i);
      lidPositions[i * 3] = pos[0];
      lidPositions[i * 3 + 1] = pos[1];
      lidPositions[i * 3 + 2] = pos[2];
    }
    for (let i = 0; i < lidMesh.numTri; i++) {
      const verts = lidMesh.verts(i);
      lidIndices[i * 3] = verts[0];
      lidIndices[i * 3 + 1] = verts[1];
      lidIndices[i * 3 + 2] = verts[2];
    }
    computeNormals(lidPositions, lidIndices, lidNormals);

    sendProgress('Generating STL...', 80);

    // Generate export data for both parts
    const bottleStlData = generateSTL(bottlePositions, bottleIndices, 'BOTTL3D Bottle');
    const lidStlData = generateSTL(lidPositions, lidIndices, 'BOTTL3D Lid');

    sendProgress('Generating 3MF...', 90);

    const bottleThreemfData = generate3MFData(bottlePositions, bottleIndices);
    const lidThreemfData = generate3MFData(lidPositions, lidIndices);

    sendProgress('Complete', 100);

    const response: ResultMessage = {
      type: 'result',
      bottleMesh: {
        positions: bottlePositions,
        normals: bottleNormals,
        indices: bottleIndices,
      },
      lidMesh: {
        positions: lidPositions,
        normals: lidNormals,
        indices: lidIndices,
      },
      bottleStlData,
      bottleThreemfData,
      lidStlData,
      lidThreemfData,
    };

    const transferList = [
      bottlePositions.buffer,
      bottleNormals.buffer,
      bottleIndices.buffer,
      lidPositions.buffer,
      lidNormals.buffer,
      lidIndices.buffer,
      bottleStlData,
      bottleThreemfData,
      lidStlData,
      lidThreemfData,
    ];

    self.postMessage(response, { transfer: transferList });

    // Clean up
    result.bottleManifold.delete();
    result.lidManifold.delete();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Worker] Generation error:', errorMessage, error);
    const response: WorkerResponse = {
      type: 'error',
      error: errorMessage,
    };
    self.postMessage(response);
  }
}

/**
 * Generate cross-section SVG for debugging.
 */
async function handleCrossSection(params: BottleParams): Promise<void> {
  try {
    const manifoldModule = await initWasm();
    const result = generateBottle(manifoldModule, params);
    const svg = generateCrossSectionSVG(manifoldModule, result.bottleManifold, result.lidManifold);

    const response: WorkerResponse = {
      type: 'cross-section-result',
      svg,
    };
    self.postMessage(response);

    result.bottleManifold.delete();
    result.lidManifold.delete();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Worker] Cross-section error:', errorMessage, error);
    const response: WorkerResponse = {
      type: 'error',
      error: `Cross-section error: ${errorMessage}`,
    };
    self.postMessage(response);
  }
}

/**
 * Compute vertex normals from triangle mesh.
 */
function computeNormals(
  positions: Float32Array,
  indices: Uint32Array,
  normals: Float32Array
): void {
  normals.fill(0);

  const numTris = indices.length / 3;
  for (let i = 0; i < numTris; i++) {
    const i0 = indices[i * 3];
    const i1 = indices[i * 3 + 1];
    const i2 = indices[i * 3 + 2];

    const v0 = [positions[i0 * 3], positions[i0 * 3 + 1], positions[i0 * 3 + 2]];
    const v1 = [positions[i1 * 3], positions[i1 * 3 + 1], positions[i1 * 3 + 2]];
    const v2 = [positions[i2 * 3], positions[i2 * 3 + 1], positions[i2 * 3 + 2]];

    const e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
    const e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

    const nx = e1[1] * e2[2] - e1[2] * e2[1];
    const ny = e1[2] * e2[0] - e1[0] * e2[2];
    const nz = e1[0] * e2[1] - e1[1] * e2[0];

    for (const idx of [i0, i1, i2]) {
      normals[idx * 3] += nx;
      normals[idx * 3 + 1] += ny;
      normals[idx * 3 + 2] += nz;
    }
  }

  const numVerts = positions.length / 3;
  for (let i = 0; i < numVerts; i++) {
    const x = normals[i * 3];
    const y = normals[i * 3 + 1];
    const z = normals[i * 3 + 2];
    const len = Math.sqrt(x * x + y * y + z * z);
    if (len > 0) {
      normals[i * 3] = x / len;
      normals[i * 3 + 1] = y / len;
      normals[i * 3 + 2] = z / len;
    }
  }
}

/**
 * Generate binary STL data from mesh.
 */
function generateSTL(
  positions: Float32Array,
  indices: Uint32Array,
  header: string = 'Generated by BOTTL3D'
): ArrayBuffer {
  const numTris = indices.length / 3;
  const bufferSize = 80 + 4 + numTris * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  for (let i = 0; i < 80; i++) {
    view.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
  }

  view.setUint32(80, numTris, true);

  let offset = 84;
  for (let i = 0; i < numTris; i++) {
    const i0 = indices[i * 3];
    const i1 = indices[i * 3 + 1];
    const i2 = indices[i * 3 + 2];

    const v0 = [positions[i0 * 3], positions[i0 * 3 + 1], positions[i0 * 3 + 2]];
    const v1 = [positions[i1 * 3], positions[i1 * 3 + 1], positions[i1 * 3 + 2]];
    const v2 = [positions[i2 * 3], positions[i2 * 3 + 1], positions[i2 * 3 + 2]];

    const e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
    const e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

    let nx = e1[1] * e2[2] - e1[2] * e2[1];
    let ny = e1[2] * e2[0] - e1[0] * e2[2];
    let nz = e1[0] * e2[1] - e1[1] * e2[0];
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len > 0) { nx /= len; ny /= len; nz /= len; }

    view.setFloat32(offset, nx, true);
    view.setFloat32(offset + 4, ny, true);
    view.setFloat32(offset + 8, nz, true);
    offset += 12;

    for (const idx of [i0, i1, i2]) {
      view.setFloat32(offset, positions[idx * 3], true);
      view.setFloat32(offset + 4, positions[idx * 3 + 1], true);
      view.setFloat32(offset + 8, positions[idx * 3 + 2], true);
      offset += 12;
    }

    view.setUint16(offset, 0, true);
    offset += 2;
  }

  return buffer;
}

/**
 * Generate 3MF data from mesh positions and indices.
 */
function generate3MFData(
  positions: Float32Array,
  indices: Uint32Array
): ArrayBuffer {
  const numVerts = positions.length / 3;
  const numTris = indices.length / 3;

  const vertexLines: string[] = [];
  for (let i = 0; i < numVerts; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    vertexLines.push(`            <vertex x="${x}" y="${y}" z="${z}" />`);
  }

  const triangleLines: string[] = [];
  for (let i = 0; i < numTris; i++) {
    const v1 = indices[i * 3];
    const v2 = indices[i * 3 + 1];
    const v3 = indices[i * 3 + 2];
    triangleLines.push(`            <triangle v1="${v1}" v2="${v2}" v3="${v3}" />`);
  }

  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>
${vertexLines.join('\n')}
        </vertices>
        <triangles>
${triangleLines.join('\n')}
        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

  const encoder = new TextEncoder();

  return createZipArchive([
    { filename: '[Content_Types].xml', data: encoder.encode(contentTypesXml) },
    { filename: '_rels/.rels', data: encoder.encode(relsXml) },
    { filename: '3D/3dmodel.model', data: encoder.encode(modelXml) },
  ]);
}

/**
 * Send progress update to main thread.
 */
function sendProgress(stage: string, percent: number): void {
  const response: WorkerResponse = {
    type: 'progress',
    stage,
    percent,
  };
  self.postMessage(response);
}

// Keep createZipArchive available for potential future use
void createZipArchive;
