import { Html } from "@react-three/drei";

const LABELS: { text: string; color: string; position: [number, number, number] }[] = [
  { text: "1. GÉNÉRATION", color: "#f2c744", position: [-26.5, 8, -10] },
  { text: "2. TRANSPORT", color: "#f6ad55", position: [-11, 8, -10] },
  { text: "3. DISTRIBUTION", color: "#68d391", position: [10, 8, -10] },
  { text: "4. CONSOMMATION", color: "#7dd3fc", position: [19, 8, -10] },
];

/** Always-visible signposts over each of the four market stages. */
export function TierLabels() {
  return (
    <>
      {LABELS.map((l) => (
        <Html key={l.text} position={l.position} center style={{ pointerEvents: "none" }}>
          <div
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.06em",
              color: l.color,
              textShadow: "0 2px 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.6)",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              borderBottom: `2px solid ${l.color}`,
              paddingBottom: 3,
            }}
          >
            {l.text}
          </div>
        </Html>
      ))}
    </>
  );
}
