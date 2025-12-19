import { Canvas } from "@react-three/fiber";
import Terminal from "./components/Terminal";
import { commands } from "./components/commands.ts";
import { PostFX } from "./components/PostEffect.tsx";

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <Terminal
          commands={commands}
          fg="#46a3ff"
          fontPx={24}
          lineHeightPx={28}
        />
        <PostFX />
      </Canvas>
    </div>
  );
}
