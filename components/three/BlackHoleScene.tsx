'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { palette } from '@/lib/theme'
import { usePrefersReducedMotion } from '@/lib/hooks'

/**
 * WebGL accretion disc.
 *
 * Particles orbit a dark core on Keplerian-ish rates — inner rings sweep faster
 * than outer ones, which is what reads as "gravity" rather than a spinning
 * texture. Colour ramps from plum at the rim to gold-white at the event
 * horizon.
 *
 * Rendered through additive points rather than meshes: ~6k particles cost one
 * draw call, and the shader does the per-particle colour and softness.
 */

const PARTICLE_COUNT = 6000
const INNER_RADIUS = 1.15
const OUTER_RADIUS = 5.2

function AccretionDisc({ intensity = 1 }: { intensity?: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // Positions, per-particle orbital rate, and a colour mix factor. Generated
  // once — the shader animates them, so no per-frame CPU work.
  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const attrs = new Float32Array(PARTICLE_COUNT * 3) // radius, speed, seed

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Bias toward the inner disc so the core reads dense.
      const t = Math.pow(Math.random(), 0.55)
      const radius = INNER_RADIUS + t * (OUTER_RADIUS - INNER_RADIUS)
      const angle = Math.random() * Math.PI * 2
      // Thin disc: vertical scatter falls off with radius.
      const thickness = (1 - t) * 0.28 + 0.04
      const y = (Math.random() - 0.5) * thickness

      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(angle) * radius

      attrs[i * 3] = radius
      // Keplerian falloff — inner orbits are much faster.
      attrs[i * 3 + 1] = 1.35 / Math.pow(radius, 1.5)
      attrs[i * 3 + 2] = Math.random()
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aOrbit', new THREE.BufferAttribute(attrs, 3))

    const u = {
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uInner: { value: INNER_RADIUS },
      uOuter: { value: OUTER_RADIUS },
      uGold: { value: new THREE.Color(palette.gold) },
      uGoldLight: { value: new THREE.Color(palette.goldLight) },
      uPlum: { value: new THREE.Color(palette.plumLight) },
    }
    return { geometry: geo, uniforms: u }
  }, [intensity])

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta
    }
    if (pointsRef.current) {
      // Slow axial drift so the disc never looks locked to the viewport.
      pointsRef.current.rotation.z += delta * 0.012
    }
  })

  return (
    <points ref={pointsRef} geometry={geometry} rotation={[Math.PI * 0.34, 0, 0]}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          attribute vec3 aOrbit;   // x = radius, y = angular speed, z = seed
          uniform float uTime;
          uniform float uInner;
          uniform float uOuter;
          varying float vFalloff;
          varying float vSeed;

          void main() {
            float radius = aOrbit.x;
            float speed  = aOrbit.y;
            float seed   = aOrbit.z;

            float baseAngle = atan(position.z, position.x);
            float angle = baseAngle + uTime * speed;

            vec3 p = vec3(cos(angle) * radius, position.y, sin(angle) * radius);

            // 0 at the rim, 1 at the event horizon.
            vFalloff = 1.0 - smoothstep(uInner, uOuter, radius);
            vSeed = seed;

            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            // Perspective-correct sizing, hotter near the core.
            gl_PointSize = (1.6 + vFalloff * 5.5) * (300.0 / -mv.z);
          }
        `}
        fragmentShader={`
          uniform vec3 uGold;
          uniform vec3 uGoldLight;
          uniform vec3 uPlum;
          uniform float uIntensity;
          uniform float uTime;
          varying float vFalloff;
          varying float vSeed;

          void main() {
            // Round, soft-edged point sprite.
            vec2 uv = gl_PointCoord - vec2(0.5);
            float d = length(uv);
            if (d > 0.5) discard;
            float soft = 1.0 - smoothstep(0.0, 0.5, d);

            // plum (rim) -> gold -> near-white (horizon)
            vec3 color = mix(uPlum, uGold, smoothstep(0.0, 0.62, vFalloff));
            color = mix(color, uGoldLight, smoothstep(0.68, 1.0, vFalloff));

            // Gentle per-particle shimmer.
            float twinkle = 0.82 + 0.18 * sin(uTime * 1.6 + vSeed * 43.0);

            float alpha = soft * (0.10 + vFalloff * 0.72) * twinkle * uIntensity;
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </points>
  )
}

/** The dark core that the disc orbits — pure occlusion, no lighting. */
function EventHorizon() {
  return (
    <mesh>
      <sphereGeometry args={[INNER_RADIUS * 0.82, 48, 48]} />
      <meshBasicMaterial color={palette.charcoal} />
    </mesh>
  )
}

type Props = {
  className?: string
  /** Scales overall particle opacity. */
  intensity?: number
}

export function BlackHoleScene({ className, intensity = 1 }: Props) {
  const reduced = usePrefersReducedMotion()

  // Under reduced motion the whole scene is skipped — no WebGL context, no
  // rAF loop, nothing to disable later.
  if (reduced) return null

  return (
    <div className={className} data-webgl-stage aria-hidden>
      <Canvas
        camera={{ position: [0, 2.6, 7.4], fov: 45 }}
        dpr={[1, 1.75]}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        frameloop="always"
        // Explicit 100%/100% rather than relying on R3F's ResizeObserver
        // measurement alone — without it the canvas can stay at its 300x150
        // default if the observer does not fire before first paint.
        style={{ width: '100%', height: '100%' }}
        resize={{ debounce: 0 }}
      >
        <EventHorizon />
        <AccretionDisc intensity={intensity} />
      </Canvas>
    </div>
  )
}

export default BlackHoleScene
