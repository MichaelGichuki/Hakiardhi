import { useState } from "react";
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


function App() {
  const [parcelQuery, setParcelQuery] = useState("KJD/LOI/4581");
  const [parcelSearched, setParcelSearched] = useState(true);
  const [stage, setStage] = useState<TransferStage>(1);
  const [ownerDecision, setOwnerDecision] = useState<
    "approved" | "rejected" | null
  >(null); 
  const [loginMessage, setLoginMessage] = useState("");
  

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
          <TamperPage />
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
          <AuditPage />
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
