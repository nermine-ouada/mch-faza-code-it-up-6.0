import React from "react";
import { Outlet } from "react-router-dom";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";
import Bubbles from "./Bubbles";
import FlowerPattern from "./FlowerPattern";

export default function PublicLayout() {
  return (
    <div className="bb-app-bg min-h-screen">
      <FlowerPattern />
      <Bubbles count={20} />

      <div className="bb-main-stack flex min-h-screen flex-col">
        <PublicNavbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <PublicFooter />
      </div>
    </div>
  );
}
