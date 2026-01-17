// src/lib/topControlPanelExtensionLogic.js
import { useMemo } from "react";

/**
 * useTopControlPanelExtension (SESSION 5)
 * ✅ Regla: Todo lo nuevo del TopControlPanel vive aquí.
 *
 * Este hook NO asume estructura interna del panel.
 * Solo calcula "extension" con datos extra.
 */
export function useTopControlPanelExtension(props = {}) {
  const extension = useMemo(() => {
    return {
      session: 5,
      enabled: true,

      // placeholders seguros
      ui: {
        // ejemplo: mostrar info extra si algún día lo usas
        // badgeText: "EXT",
      },

      // aquí irán tus nuevas piezas:
      // extraFilters: ...
      // validators: ...
      // derivedState: ...
    };
  }, []);

  return extension;
}
