import { useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useBottleStore } from '../../store/useBottleStore';
import { useBottleWorker } from '../../engine/useBottleWorker';
import { meshToThreeGeometry } from '../../engine/bridge';

function BottleMesh() {
  const bottleMeshData = useBottleStore((s) => s.bottleMeshData);

  const geometry = useMemo(() => {
    if (!bottleMeshData) return null;
    return meshToThreeGeometry(bottleMeshData);
  }, [bottleMeshData]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color="#b8b8b8"
        metalness={0.1}
        roughness={0.6}
        flatShading={true}
      />
    </mesh>
  );
}

function LidMesh() {
  const lidMeshData = useBottleStore((s) => s.lidMeshData);
  const showExploded = useBottleStore((s) => s.showExploded);

  const geometry = useMemo(() => {
    if (!lidMeshData) return null;
    return meshToThreeGeometry(lidMeshData);
  }, [lidMeshData]);

  if (!geometry) return null;

  // Lid geometry is flush on top of bottle (at bottleHeight along Z).
  // After the -90° X rotation applied to the group, Z becomes -Y in Three.js,
  // so "up" in the rotated group is still the Z direction of the geometry.
  // For exploded view, shift the lid up (in the group's local Z) by 20mm.
  const position: [number, number, number] = showExploded ? [0, 0, 20] : [0, 0, 0];

  return (
    <mesh geometry={geometry} position={position} castShadow receiveShadow>
      <meshStandardMaterial
        color="#7cb9e8"
        metalness={0.1}
        roughness={0.5}
        flatShading={true}
      />
    </mesh>
  );
}

function ViewManager() {
  const { camera, controls } = useThree();
  const resetView = useBottleStore((s) => s.resetView);

  useEffect(() => {
    if (resetView > 0) {
      camera.position.set(200, 150, 200);
      camera.lookAt(0, 70, 0);

      if (controls) {
        // @ts-expect-error - controls is unknown but we know it's OrbitControls
        controls.reset();
      }
    }
  }, [resetView, camera, controls]);

  return null;
}

function ResetViewButton() {
  const requestResetView = useBottleStore((s) => s.requestResetView);

  return (
    <button
      onClick={requestResetView}
      className="absolute bottom-4 right-4 bg-[var(--bg-sidebar)] border border-[var(--border-main)] hover:bg-[var(--bg-app)] text-[var(--fg-main)] p-2 shadow-lg transition-colors z-20"
      title="Reset View"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    </button>
  );
}

function Scene() {
  const theme = useBottleStore((s) => s.theme);
  
  // Vellum (Light) vs Deep Draft (Dark)
  const bgColor = theme === 'dark' ? '#0A192F' : '#EBF3FF';
  const gridColor = theme === 'dark' ? '#64FFDA' : '#00509E';
  const gridOpacity = theme === 'dark' ? 0.05 : 0.1;

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <ambientLight intensity={theme === 'dark' ? 0.5 : 0.8} />
      <pointLight position={[100, 100, 100]} intensity={1.5} castShadow />
      <pointLight position={[-100, 100, -100]} intensity={0.5} />

      <Grid
        args={[400, 400]}
        cellSize={40}
        cellThickness={1}
        cellColor={gridColor}
        sectionSize={40}
        sectionThickness={1}
        sectionColor={gridColor}
        fadeDistance={1000}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
        opacity={gridOpacity}
        transparent
      />

      {/* Rotate -90° around X to convert Manifold's Z-up to Three.js Y-up.
          No Center wrapper — geometry sits with base at origin, camera targets midpoint. */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <BottleMesh />
        <LidMesh />
      </group>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minDistance={50}
        maxDistance={1000}
        target={[0, 70, 0]}
      />

      <ViewManager />
    </>
  );
}

function LoadingOverlay() {
  const isGenerating = useBottleStore((s) => s.isGenerating);
  const progress = useBottleStore((s) => s.progress);
  const progressStage = useBottleStore((s) => s.progressStage);

  if (!isGenerating) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] z-10">
      <div className="bg-[var(--bg-sidebar)] border border-[var(--border-main)] p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
          <div>
            <div className="text-[var(--fg-main)] font-medium">{progressStage || 'Generating...'}</div>
            <div className="text-[var(--fg-muted)] text-sm font-technical">{progress}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorOverlay() {
  const error = useBottleStore((s) => s.error);

  if (!error) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
      <div className="bg-red-900/90 border border-red-500 p-6 shadow-xl max-w-md">
        <div className="text-red-200 font-medium mb-2">Generation Error</div>
        <div className="text-red-100 text-sm font-technical">{error}</div>
      </div>
    </div>
  );
}

export function BottlePreview() {
  useBottleWorker();

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows
        camera={{
          position: [250, 180, 250],
          fov: 50,
          near: 1,
          far: 5000,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
        }}
      >
        <Scene />
      </Canvas>
      <ResetViewButton />
      <LoadingOverlay />
      <ErrorOverlay />
    </div>
  );
}
