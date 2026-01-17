// src/components/Table1Extension.jsx
import React from "react";
import Table1 from "../pages/Table1.jsx";
import { useTable1Extension } from "../lib/table1ExtensionLogic";

/**
 * Table1Extension (SESSION 5)
 * ✅ Regla: NO tocar Table1.jsx
 * - Este wrapper es el único lugar donde agregamos nuevas funciones para Tabla 1.
 */
export default function Table1Extension(props) {
  const extension = useTable1Extension(props);

  // Table1 puede ignorar "extension" sin romper nada.
  // Si más adelante Table1 ya consume algo, se lo pasamos aquí.
  return <Table1 {...props} extension={extension} />;
}
