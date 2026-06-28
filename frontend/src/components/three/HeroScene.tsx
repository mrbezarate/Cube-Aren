'use client';

import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Particles() {
  const ref = useRef<THREE.Points>(null);
  
  // Create simple particle coordinates
  const count = 1200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 15;     // X
    positions[i + 1] = (Math.random() - 0.5) * 15; // Y
    positions[i + 2] = (Math.random() - 0.5) * 15; // Z
  }

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.getElapsedTime() * 0.02;
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#7c3aed"
          size={0.04}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

function FloatingShapes() {
  const groupRef = useRef<THREE.Group>(null);
  const octaRef = useRef<THREE.Mesh>(null);
  const torusRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = elapsed * 0.05;
    }
    if (octaRef.current) {
      octaRef.current.rotation.x = elapsed * 0.3;
      octaRef.current.rotation.y = elapsed * 0.2;
      octaRef.current.position.y = Math.sin(elapsed * 2) * 0.2;
    }
    if (torusRef.current) {
      torusRef.current.rotation.x = elapsed * 0.15;
      torusRef.current.rotation.y = elapsed * 0.25;
      torusRef.current.position.y = Math.cos(elapsed * 1.5) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Octahedron in Center */}
      <mesh ref={octaRef} position={[-2, 1, -3]}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshBasicMaterial color="#2563eb" wireframe transparent opacity={0.6} />
      </mesh>
      
      {/* Torus on the other side */}
      <mesh ref={torusRef} position={[3, -1.5, -4]}>
        <torusGeometry args={[0.7, 0.2, 8, 24]} />
        <meshBasicMaterial color="#7c3aed" wireframe transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 bg-[#020205] overflow-hidden">
      <Suspense fallback={<div className="absolute inset-0 bg-[#020205] opacity-50" />}>
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#7c3aed" />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#2563eb" />
          <Particles />
          <FloatingShapes />
        </Canvas>
      </Suspense>
      {/* Overlay to darken background further */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-[#0a0a0f] opacity-80 pointer-events-none" />
    </div>
  );
}
