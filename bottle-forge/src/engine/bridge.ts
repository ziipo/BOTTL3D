import * as THREE from 'three';

/**
 * Mesh data from the Web Worker.
 */
export interface WorkerMeshData {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
}

/**
 * Converts mesh data from the worker to a Three.js BufferGeometry.
 */
export function meshToThreeGeometry(meshData: WorkerMeshData): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  // Set position attribute
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(meshData.positions, 3)
  );

  // Set index
  geometry.setIndex(new THREE.BufferAttribute(meshData.indices, 1));

  // Compute bounding box and sphere for culling
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}
