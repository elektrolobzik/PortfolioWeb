"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

/** ease для движения камеры */
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Плейсхолдер-комната на случай, если room.glb отсутствует */
function PlaceholderRoom({ progress }: { progress: number }) {
  const group = useRef<THREE.Group>(null!);
  const e = easeInOutCubic(clamp01(progress));

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    // камера: лёгкий «наезд»
    const camZ = THREE.MathUtils.lerp(4.2, 2.6, e);
    const camY = THREE.MathUtils.lerp(0.25, 0.4, e);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, camZ, 4, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, camY, 4, delta);
    const targetFov = THREE.MathUtils.lerp(60, 50, e);
    state.camera.fov = THREE.MathUtils.damp(state.camera.fov, targetFov, 6, delta);
    state.camera.lookAt(0, 0, 0);
    state.camera.updateProjectionMatrix();

    // лёгкая «жизнь»
    group.current.rotation.y = Math.sin(t * 0.25) * 0.06 * (1 - e);
    group.current.position.y = Math.sin(t * 0.6) * 0.03 - 0.6;
  });

  return (
    <group ref={group} position={[0,0,0]}>
      {/* пол */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1,0]}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* стены */}
      <mesh position={[0,0,-3]}>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#1a1a1a" roughness={1} />
      </mesh>
      <mesh rotation={[0,Math.PI/2,0]} position={[-3,0,0]}>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#171717" roughness={1} />
      </mesh>
      {/* «мебель» */}
      <mesh position={[-1.2,-0.5,-1.2]}>
        <boxGeometry args={[1.4, 0.4, 0.8]} />
        <meshStandardMaterial color="#9bb1ff" metalness={0.1} roughness={0.6} />
      </mesh>
      <mesh position={[1.1,-0.3,-0.6]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#f3a8c0" metalness={0.1} roughness={0.6} />
      </mesh>
      <mesh position={[0.2,-0.8,1.0]}>
        <boxGeometry args={[2.2, 0.3, 0.6]} />
        <meshStandardMaterial color="#b0f2c2" metalness={0.1} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Отдельный компонент, который реально грузит GLB, вызывается ТОЛЬКО когда файл точно есть */
function RoomGLTF({ progress }: { progress: number }) {
  const group = useRef<THREE.Group>(null!);
  const { scene } = useGLTF("/models/room.glb") as unknown as { scene: THREE.Group };

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const p = easeInOutCubic(clamp01(progress));
    const camZ = THREE.MathUtils.lerp(4.2, 2.6, p);
    const camY = THREE.MathUtils.lerp(0.25, 0.4, p);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, camZ, 4, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, camY, 4, delta);
    const targetFov = THREE.MathUtils.lerp(60, 50, p);
    state.camera.fov = THREE.MathUtils.damp(state.camera.fov, targetFov, 6, delta);
    state.camera.lookAt(0, 0, 0);
    state.camera.updateProjectionMatrix();

    const rotBase = 0.15 * (1 - p);
    group.current.rotation.y += delta * rotBase;
    group.current.position.y = Math.sin(t * 0.6) * 0.03 - 0.6;
  });

  return <group ref={group}><primitive object={scene} /></group>;
}

export default function ScrollScene({ progress }: { progress: number }) {
  const [hasModel, setHasModel] = useState<boolean | null>(null);

  // Проверяем наличие файла перед тем как вызывать useGLTF
  useEffect(() => {
    let active = true;
    fetch("/models/room.glb", { method: "HEAD" })
      .then((r) => active && setHasModel(r.ok))
      .catch(() => active && setHasModel(false));
    return () => { active = false; };
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0.25, 4.2], fov: 60 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      className="w-full h-full"
    >
      <Suspense fallback={null}>
        <color attach="background" args={["#0a0a0a"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 4]} intensity={1.1} />
        <Environment preset="apartment" environmentIntensity={0.6} />
        {hasModel ? <RoomGLTF progress={progress} /> : <PlaceholderRoom progress={progress} />}
      </Suspense>
    </Canvas>
  );
}
