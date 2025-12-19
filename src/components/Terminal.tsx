import * as React from "react";
import * as THREE from "three";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { TerminalEngine } from "./terminalEngine";
import { shaderMaterial } from "@react-three/drei";
import type { TerminalCommand } from "./terminalEngine.ts";
import vert from "../shaders/crt.vert.glsl?raw";
import frag from "../shaders/crt.frag.glsl?raw";
import figlet from "figlet";
import standard from "figlet/importable-fonts/Standard.js";

const CrtMaterial = shaderMaterial(
  {
    map: null as THREE.Texture | null,
    curvature: 0.18,
    vignette: 0.35,
    time: 0,
  },
  vert,
  frag,
);

extend({ CrtMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      crtMaterial: any;
    }
  }
}

type Props = {
  commands?: Record<string, TerminalCommand>;

  termAspect?: number;

  fontFamily?: string;
  fontPx?: number;
  lineHeightPx?: number;

  fg?: string;
  bg?: string;

  maxDpr?: number;
};

export default function Terminal({
  commands,
  termAspect = 4 / 3,

  fontFamily = '"Departure Mono", monospace',
  fontPx = 20,
  lineHeightPx = 22,

  fg = "#00ff66",
  bg = "#000000",

  maxDpr = 2,
}: Props) {
  const [theme, setTheme] = React.useState({ fg, bg });
  const engineRef = React.useRef<TerminalEngine>();
  if (!engineRef.current) {
    engineRef.current = new TerminalEngine({
      commands: commands ?? {},
      actions: {
        setTheme: (t) => setTheme((prev) => ({ ...prev, ...t })),
      },
    });

    figlet.parseFont("Standard", standard);
    figlet
      .textSync("HELLO!", {
        font: "Standard",
      })
      .split("\n")
      .forEach((line) => engineRef.current.print(line));

    engineRef.current.print("Welcome traveller!");
    engineRef.current.print("type `help`");
    engineRef.current.print("");
  }

  React.useEffect(() => {
    if (commands) engineRef.current?.setCommands(commands);
  }, [commands]);

  const { viewport, size, gl } = useThree();

  const viewAspect = viewport.width / viewport.height;
  let planeW: number;
  let planeH: number;
  if (viewAspect > termAspect) {
    planeH = viewport.height;
    planeW = planeH * termAspect;
  } else {
    planeW = viewport.width;
    planeH = planeW / termAspect;
  }

  const dpr = Math.min(gl.getPixelRatio(), maxDpr);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const textureRef = React.useRef<THREE.CanvasTexture | null>(null);

  if (!canvasRef.current) {
    const c = document.createElement("canvas");
    canvasRef.current = c;
  }
  if (!textureRef.current && canvasRef.current) {
    const t = new THREE.CanvasTexture(canvasRef.current);
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.colorSpace = THREE.SRGBColorSpace;
    textureRef.current = t;
  }

  React.useEffect(() => {
    const canvas = canvasRef.current!;

    const fracW = planeW / viewport.width;
    const fracH = planeH / viewport.height;

    const w = Math.max(1, Math.floor(size.width * fracW * dpr));
    const h = Math.max(1, Math.floor(size.height * fracH * dpr));

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;

      textureRef.current?.dispose();
      textureRef.current = new THREE.CanvasTexture(canvas);
    }
  }, [
    size.width,
    size.height,
    dpr,
    planeW,
    planeH,
    viewport.width,
    viewport.height,
  ]);

  const [focused, setFocused] = React.useState(true);
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!focused) return;
      engineRef.current?.handleKeyDown(e);
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown as any);
  }, [focused]);

  const [fontsReady, setFontsReady] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // @ts-ignore
        await document.fonts?.load?.(`${fontPx}px ${fontFamily}`);
        // @ts-ignore
        await document.fonts?.ready;
      } catch {}
      if (alive) setFontsReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [fontFamily, fontPx]);

  const matRef = React.useRef<any>(null);

  useFrame(({ clock }) => {
    if (!fontsReady) return;

    matRef.current &&
      (matRef.current.uniforms.time.value = clock.getElapsedTime());
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cursorOn = Math.floor(clock.getElapsedTime() * 2) % 2 === 0;

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = theme.fg;
    ctx.textBaseline = "top";
    ctx.font = `${fontPx * dpr}px ${fontFamily}`; // scale font with DPR
    ctx.imageSmoothingEnabled = false;

    const padding = 16 * dpr;
    const lh = lineHeightPx * dpr;

    const maxLines = Math.floor((canvas.height - padding * 2) / lh);
    const lines = engineRef.current?.getLastLines(maxLines, cursorOn) ?? [];

    let y = padding;
    for (const line of lines) {
      ctx.fillText(line, padding, y);
      y += lh;
    }

    textureRef.current!.needsUpdate = true;
  });

  return (
    <mesh
      onPointerDown={(e) => {
        e.stopPropagation();
        setFocused(true);
      }}
      onPointerMissed={() => setFocused(false)}
    >
      <planeGeometry args={[planeW, planeH]} />

      <crtMaterial
        ref={matRef}
        map={textureRef.current!}
        curvature={0.1}
        vignette={0.0}
      />
    </mesh>
  );
}
