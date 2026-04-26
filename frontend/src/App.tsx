import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import PublicLayout from "./components/PublicLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import RequireAuth from "./components/RequireAuth";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Inventory from "./pages/Inventory";
import Experiments from "./pages/Experiments";
import Assistant from "./pages/Assistant";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import Oversight from "./pages/Oversight";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/oversight" element={<Oversight />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
