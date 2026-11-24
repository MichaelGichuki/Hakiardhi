import React, { useState, type ReactElement } from "react";
import type { Page } from "../types";
import {
  Activity,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Menu,
  ScrollText,
  Search,
  ShieldCheck,
  Smartphone,
  UserRound,
  X,
} from "lucide-react";
import { Badge } from "./Badge";
import { useLocation, useNavigate } from "react-router";
import type { Role, User } from "../types/auth.types";
import { useSelector } from "react-redux";

type NavGroup = {
  label: string;
  role: Role;
  items: {
    id: Page;
    label: string;
    icon: any;
  }[];
};

export default function PageStructure({
  children,
}: {
  children: React.ReactNode;
}) {
  const navGroups: NavGroup[] = [
    {
      label: "Admin",
      role: "Admin",
      items: [
        {
          id: "dashboard" as Page,
          label: "Command Center",
          icon: LayoutDashboard,
        },
        { id: "parcels" as Page, label: "Parcel Records", icon: Search },
        // { id: "workflow" as Page, label: "Transfer Workflow", icon: Activity },
        { id: "transfer" as Page, label: "Parcel transfer", icon: ScrollText },
        {
          id: "tamper" as Page,
          label: "Tamper Detection",
          icon: ShieldCheck,
        },
        {
          id: "audit" as Page,
          label: "Immutable Audit Trail",
          icon: ClipboardList,
        },
        {
          id: "certificate" as Page,
          label: "Digital Title",
          icon: FileText,
        },
        { id: "ussd" as Page, label: "USSD Simulator", icon: Smartphone },
      ],
    },
    {
      label: "Registrar",
      role: "Registar",
      items: [
        {
          id: "audit" as Page,
          label: "Immutable Audit Trail",
          icon: ClipboardList,
        },
        { id: "parcels" as Page, label: "Parcel Records", icon: Search },
        {
          id: "tamper" as Page,
          label: "Tamper Detection",
          icon: ShieldCheck,
        },
        // { id: "workflow" as Page, label: "Transfer Workflow", icon: Activity },
        { id: "transfer" as Page, label: "Parcel transfer", icon: ScrollText },
        {
          id: "certificate" as Page,
          label: "Digital Title",
          icon: FileText,
        },
      ],
    },
    {
      label: "Land Owner",
      role: "LandOwner",
      items: [
        { id: "landowner" as Page, label: "Landowner Portal", icon: UserRound },
        {
          id: "tamper" as Page,
          label: "Tamper Detection",
          icon: ShieldCheck,
        },
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
    transfer: "Tranfer Land parcel"
  };

   const path = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [page, setPage] = useState<Page>("dashboard");
  const navigate = useNavigate();
  const role = useSelector((state: any) => state.auth.user?.role)
  const user: User | undefined = useSelector((state: any) => state.auth.user);
  const group: NavGroup | undefined = navGroups.find((v: NavGroup) => v.role == role)

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
          {
            <div className="nav-group" key={group?.label}>
              <div className="nav-label">{group?.label}</div>
              {group?.items.map((item) => {
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
          }
          {/* {navGroups.map((group) => (
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
          ))} */}
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
              Republic of Kenya <span>/</span> {pageTitles[path.pathname.replace("/", "") as Page] ?? ""}
            </div>
            <div className="topbar-right">
              <Badge tone="green">● Network online</Badge>
              <span className="officer-name">{user?.name}</span>
              <div className="avatar">{user?.name[0] ?? ""}</div>
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
