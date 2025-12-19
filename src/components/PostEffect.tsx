import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  ChromaticAberration,
  Scanline,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

export function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={1.7}
        luminanceThreshold={0.1}
        luminanceSmoothing={0.2}
        mipmapBlur
      />
      <ChromaticAberration offset={new THREE.Vector2(0.0008, 0.0)} />
      <Scanline density={1.5} opacity={0.3} />
      <Vignette eskil={false} offset={0.15} darkness={0.92} />
      <Noise
        premultiply
        blendFunction={BlendFunction.SOFT_LIGHT}
        opacity={0.3}
      />
    </EffectComposer>
  );
}
