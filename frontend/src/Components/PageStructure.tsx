import React, { useState } from "react";
import type { Page } from "../types";
import {
  Activity,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Menu,
  Search,
  ShieldCheck,
  Smartphone,
  UserRound,
  X,
} from "lucide-react";
import { Badge } from "./Badge";
import { useNavigate } from "react-router";

export default function PageStructure({
  children,
}: {
  children: React.ReactNode;
}) {
  const navGroups = [
    {
      label: "WORKSPACE",
      items: [
        {
          id: "dashboard" as Page,
          label: "Command Center",
          icon: LayoutDashboard,
        },
        { id: "parcels" as Page, label: "Parcel Records", icon: Search },
        { id: "workflow" as Page, label: "Transfer Workflow", icon: Activity },
        { id: "landowner" as Page, label: "Landowner Portal", icon: UserRound },
      ],
    },
    {
      label: "SECURITY & TRUST",
      items: [
        { id: "tamper" as Page, label: "Tamper Detection", icon: ShieldCheck },
        {
          id: "audit" as Page,
          label: "Immutable Audit Trail",
          icon: ClipboardList,
        },
        { id: "certificate" as Page, label: "Digital Title", icon: FileText },
      ],
    },
    {
      label: "FIELD ACCESS",
      items: [
        { id: "ussd" as Page, label: "USSD Simulator", icon: Smartphone },
      ],
    },
  ];
  const pageTitles: Record<Page, string> = {
    dashboard: "Command Center",
    parcels: "Parcel Records",
    workflow: "Transfer Workflow",
    landowner: "Landowner Portal",
    ussd: "USSD Simulator",
    tamper: "Tamper Detection",
    certificate: "Digital Title",
    audit: "Immutable Audit Trail",
    login: "Secure Authentication",
  };

  const [mobileOpen, setMobileOpen] = useState(false);
  const [page, setPage] = useState<Page>("dashboard");
  const navigate = useNavigate();

  const go = (next: Page) => {
    setPage(next);
    setMobileOpen(false);
    navigate(`/${next}`);
  };

  return (
    <>
      <div className="app-shell">
        <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
          <div className="brand">
            <div className="brand-mark">H</div>
            <div>
              <b>HakiArdhi</b>
              <small>LAND REGISTRY</small>
            </div>
            <button
              className="mobile-close"
              onClick={() => setMobileOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${page === item.id ? "active" : ""}`}
                    onClick={() => go(item.id)}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
          <div className="sidebar-bottom">
            <div className="network-dot">
              <span /> Fabric network connected
            </div>
            <small>
              DEMO ENVIRONMENT
              <br />
              Kenya Land Administration
            </small>
          </div>
        </aside>
        <main className="main-area">
          <header className="topbar">
            <button className="mobile-menu" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="crumb">
              Republic of Kenya <span>/</span> {pageTitles[page]}
            </div>
            <div className="topbar-right">
              <Badge tone="green">● Network online</Badge>
              <span className="officer-name">Demo Officer</span>
              <div className="avatar">DO</div>
            </div>
          </header>
          <div className="content">{children}</div>
          <footer className="app-footer">
            HAKIARDHI · NATIONAL LAND REGISTRY PROTOTYPE · SYNTHETIC
            DEMONSTRATION DATA
          </footer>
        </main>
      </div>
    </>
  );
}
