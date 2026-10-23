import { lazy, Suspense } from "react";
import type { CharacterCfg } from "../lib/types";

// three.js alada chunk e — text/layout age load hoy, 3D pore.
const ModelScene = lazy(() => import("./ModelScene"));
const ReliefScene = lazy(() => import("./ReliefScene"));

/** .glb model thakle real 3D, na hole photo theke depth-relief. */
export default function CharacterScene({ cfg, className = "" }: { cfg: CharacterCfg; className?: string }) {
  return (
    <Suspense fallback={<span className="char-loader" />}>
      {cfg.model ? <ModelScene cfg={cfg} className={className} /> : <ReliefScene cfg={cfg} className={className} />}
    </Suspense>
  );
}
