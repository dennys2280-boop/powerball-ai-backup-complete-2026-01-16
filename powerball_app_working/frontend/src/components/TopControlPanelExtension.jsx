// src/components/TopControlPanelExtension.jsx
import React from "react";
import TopControlPanel from "./TopControlPanel";
import { useTopControlPanelExtension } from "../lib/topControlPanelExtensionLogic";

/**
 * TopControlPanelExtension (SESSION 5)
 * ✅ Regla: NO tocar TopControlPanel.jsx
 * - Este wrapper es el único lugar donde agregamos nuevas funciones para TopControlPanel.
 */
export default function TopControlPanelExtension(props) {
  const extension = useTopControlPanelExtension(props);

  // TopControlPanel puede ignorar "extension" sin romper nada.
  return <TopControlPanel {...props} extension={extension} />;
}
