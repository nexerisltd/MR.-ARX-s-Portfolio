import type { CharacterCfg } from "../lib/types";
import ModelScene from "./ModelScene";
import ReliefScene from "./ReliefScene";

/** .glb model thakle real 3D, na hole photo theke depth-relief. */
export default function CharacterScene({ cfg, className = "" }: { cfg: CharacterCfg; className?: string }) {
  return cfg.model ? <ModelScene cfg={cfg} className={className} /> : <ReliefScene cfg={cfg} className={className} />;
}
