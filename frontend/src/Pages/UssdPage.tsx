import { useState } from "react";
import { PageHeading } from "../Components/PageHeading";
import { Card } from "../Components/Card";
import { Badge } from "../Components/Badge";
import { RotateCcw } from "lucide-react";
import { ActivityRow } from "../Components/ActivityRow";

export function UssdPage() {
  const [screen, setScreen] = useState(0);
  const [decision, setDecision] = useState<"confirm" | "reject" | null>(null);
  const [pin, setPin] = useState("");
  const screens = [
    "Safaricom  10:42\\n--------------------\\nHAKIARDHI\\nLand Registry Service\\n\\nWelcome, Mary Wanjiku.\\n\\n1. My Properties\\n2. Transfer Requests\\n3. Verify Title\\n\\nSelect option:",
    "MY PROPERTIES\\n--------------------\\n1. KJD/LOI/4581\\n   0.045 Ha\\n2. KJD/LOI/4590\\n   0.080 Ha\\n\\n0. Back",
    "TRANSFER REQUESTS\\n--------------------\\n1. TR-2026-0841\\nParcel: KJD/LOI/4581\\nBuyer: Peter Mwangi\\nType: Sale\\n\\n0. Back",
    "TRANSFER DETAILS\\n--------------------\\nParcel: KJD/LOI/4581\\nBuyer: Peter Mwangi\\n\\n1. Confirm transfer\\n2. Reject transfer\\n0. Back",
    "ENTER SECURITY PIN\\n--------------------\\nEnter your 4-digit PIN:\\n\\nUse keypad below.",
    "CONSENT RECORDED\\n--------------------\\nYour decision has been recorded.\\n\\nReference: TR-2026-0841\\n\\nThank you.\\n\\n0. Main menu",
    "TRANSFER REJECTED\\n--------------------\\nYour rejection has been recorded.\\n\\nReference: TR-2026-0841\\n\\nThank you.\\n\\n0. Main menu",
    "VERIFY TITLE\\n--------------------\\nKJD/LOI/4581\\nStatus: Registered\\n\\n0. Back",
  ];
  const keyPress = (key: string) => {
    if (screen === 0)
      setScreen(key === "1" ? 1 : key === "2" ? 2 : key === "3" ? 7 : 0);
    else if ([1, 2, 7].includes(screen)) {
      if (key === "0") setScreen(0);
      else if (screen === 2 && key === "1") setScreen(3);
    } else if (screen === 3) {
      if (key === "1" || key === "2") {
        setDecision(key === "1" ? "confirm" : "reject");
        setPin("");
        setScreen(4);
      } else if (key === "0") setScreen(2);
    } else if (screen === 4) {
      if (/^\d$/.test(key) && pin.length < 4) {
        const next = pin + key;
        setPin(next);
        if (next.length === 4) setScreen(decision === "confirm" ? 5 : 6);
      } else if (key === "*") setPin("");
    } else if ([5, 6].includes(screen) && key === "0") {
      setScreen(0);
      setDecision(null);
      setPin("");
    }
  };
  const reset = () => {
    setScreen(0);
    setPin("");
    setDecision(null);
  };
  return (
    <>
      <PageHeading
        title="USSD Feature Phone Simulator"
        subtitle="A low-connectivity consent channel for citizens without smartphones or internet."
      />
      <div className="two-col section-gap align-start">
        <Card>
          <div className="eyebrow">SIMULATED NETWORK</div>
          <Badge tone="green">2G · GSM · USSD session</Badge>
          <div className="phone">
            <div className="phone-brand">HAKIARDHI MOBILE SERVICE</div>
            <div className="phone-screen">
              {screens[screen].replace("\\n", "\n")}
              {screen === 4 ? `\n\nPIN: ${"•".repeat(pin.length)}` : ""}
            </div>
            <div className="keypad">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(
                (k) => (
                  <button key={k} onClick={() => keyPress(k)}>
                    {k}
                  </button>
                ),
              )}
            </div>
            <div className="phone-softkeys">
              <span>CALL</span>
              <span>MENU</span>
              <span>END</span>
            </div>
          </div>
          <div className="center">
            <button className="btn" onClick={reset}>
              <RotateCcw size={14} /> Restart session
            </button>
          </div>
        </Card>
        <Card>
          <h3>How the USSD consent flow works</h3>
          <ActivityRow
            title="Dial *483*55#"
            meta="Citizen opens a network USSD session."
            status="1"
          />
          <ActivityRow
            title="Select transfer requests"
            meta="View pending transfer notifications."
            status="2"
          />
          <ActivityRow
            title="Review parcel and buyer"
            meta="Check the transaction before making a decision."
            status="3"
          />
          <ActivityRow
            title="Authenticate with PIN"
            meta="Securely authorize or reject the request."
            status="4"
          />
          <ActivityRow
            title="Consent recorded"
            meta="Backend records authenticated consent and anchors its hash."
            status="5"
          />
          <div className="notice">
            Prototype note: This is an interactive USSD simulation. Actual
            deployment requires a mobile network gateway, secure PIN
            verification and a backend consent service. A phone without internet
            can still use operator-provided USSD connectivity.
          </div>
        </Card>
      </div>
    </>
  );
}
