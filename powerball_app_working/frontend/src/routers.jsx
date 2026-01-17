// src/routers.jsx
import { Routes, Route } from "react-router-dom";

import AppLayout from "./layouts/AppLayout.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import History from "./pages/History.jsx";
import Decompose from "./pages/Decompose.jsx";
import Table1Extension from "./components/Table1Extension.jsx";
import FutureDrawsPage from "./pages/FutureDrawsPage.tsx";
import Settings from "./pages/Settings.jsx";
import NotFound from "./pages/NotFound.jsx";
import RobotCoachPage from "./pages/RobotCoachPage.tsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/table1" element={<Table1Extension />} />

        {/* SECTION 4 — DECOMPOSE (after Filters) */}
        <Route path="/decompose" element={<Decompose />} />

        <Route path="/future-draws" element={<FutureDrawsPage />} />
        <Route path="/settings" element={<Settings />} />

        {/* ROBOT COACH */}
        <Route path="/robot" element={<RobotCoachPage />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
