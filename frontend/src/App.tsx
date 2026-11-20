import { useMemo, useState } from "react";
import { ParcelPage } from "./Pages/ParcelPage";
import { WorkflowPage } from "./Pages/WorkflowPage";
import { LandownerPage } from "./Pages/LandownerPage";
import { UssdPage } from "./Pages/UssdPage";
import { TamperPage } from "./Pages/TamperPage";
import { CertificatePage } from "./Pages/CertificatePage";
import { AuditPage } from "./Pages/AuditPage";
import { LoginPage } from "./Pages/LoginPage";
import type { TransferStage } from "./types";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import PageStructure from "./Components/PageStructure";
import { Dashboard } from "./Pages/Dashboard";
import ParcelTransfer from "./Pages/ParcelTransfer";

const originalRecord = {
  owner: "Mary Wanjiku Kamau",
  size: "0.045 Ha",
  county: "Kajiado",
};

function App() {
  const [parcelQuery, setParcelQuery] = useState("KJD/LOI/4581");
  const [parcelSearched, setParcelSearched] = useState(true);
  const [stage, setStage] = useState<TransferStage>(1);
  const [ownerDecision, setOwnerDecision] = useState<
    "approved" | "rejected" | null
  >(null);
  const [dbRecord, setDbRecord] = useState(originalRecord);
  const [auditQuery, setAuditQuery] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const tampered = Object.keys(originalRecord).some(
    (k) =>
      dbRecord[k as keyof typeof originalRecord] !==
      originalRecord[k as keyof typeof originalRecord],
  );

  const auditRows = [
    [
      "02 Nov 2026 10:42",
      "Land Officer",
      "Transfer initiated",
      "TR-2026-0841",
      "0x7a31...b90e",
    ],
    [
      "02 Nov 2026 10:16",
      "Citizen Portal",
      "Owner consent recorded",
      "TR-2026-0838",
      "0x3b92...e12a",
    ],
    [
      "02 Nov 2026 09:51",
      "Verification Officer",
      "Document hash anchored",
      "TR-2026-0841",
      "0x81c2...a63f",
    ],
    [
      "02 Nov 2026 09:14",
      "Registrar",
      "Title version approved",
      "KJD/LOI/4581",
      "0x4f8b...2c10",
    ],
    [
      "01 Nov 2026 16:28",
      "Land Officer",
      "Parcel record verified",
      "KJD/LOI/4590",
      "0x92d0...3e61",
    ],
    [
      "01 Nov 2026 14:03",
      "Verification Officer",
      "Legal document review",
      "TR-2026-0836",
      "0xc7a1...f04b",
    ],
  ];
  const filteredAudit = useMemo(
    () =>
      auditRows.filter((row) =>
        row.join(" ").toLowerCase().includes(auditQuery.toLowerCase()),
      ),
    [auditQuery],
  );

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <LoginPage message={loginMessage} setMessage={setLoginMessage} />
      ),
    },
    {
      path: "/parcels",
      element: (
        <PageStructure>
          <ParcelPage
            query={parcelQuery}
            setQuery={setParcelQuery}
            searched={parcelSearched}
            setSearched={setParcelSearched}
          />
        </PageStructure>
      ),
    },
    {
      path: "/workflow",
      element: (
        <PageStructure>
          <WorkflowPage stage={stage} setStage={setStage} />
        </PageStructure>
      ),
    },
    {
      path: "/dashboard",
      element: (
        <PageStructure>
          <Dashboard />
        </PageStructure>
      ),
    },

    {
      path: "/landowner",
      element: (
        <PageStructure>
          <LandownerPage
            decision={ownerDecision}
            setDecision={setOwnerDecision}
          />
        </PageStructure>
      ),
    },
    {
      path: "/ussd",
      element: (
        <PageStructure>
          <UssdPage />
        </PageStructure>
      ),
    },
    {
      path: "/tamper",
      element: (
        <PageStructure>
          <TamperPage
            record={dbRecord}
            setRecord={setDbRecord}
            tampered={tampered}
          />
        </PageStructure>
      ),
    },
    {
      path: "/certificate",
      element: (
        <PageStructure>
          <CertificatePage />
        </PageStructure>
      ),
    },
    {
      path: "/audit",
      element: (
        <PageStructure>
          <AuditPage
            query={auditQuery}
            setQuery={setAuditQuery}
            rows={filteredAudit}
          />
        </PageStructure>
      ),
    },
    {
      path: "/transfer",
      element: (
        <PageStructure>
          <ParcelTransfer />
        </PageStructure>
      ),
    },
  ]);

  return (
    <div className="app-shell">
      <main className="main-area">
        <RouterProvider router={router} />,
        {/* <footer className="app-footer">
          HAKIARDHI · NATIONAL LAND REGISTRY PROTOTYPE · SYNTHETIC DEMONSTRATION
          DATA
        </footer> */}
      </main>
    </div>
  );
}

export default App;
