import { useState } from "react";
import { PageHeading } from "../Components/PageHeading";
import { Card } from "../Components/Card";
import { ArrowRight, Landmark, LockKeyhole } from "lucide-react";

export function LoginPage({
  message,
  setMessage,
}: {
  message: string;
  setMessage: (v: string) => void;
}) {
  const [role, setRole] = useState("Government Staff");
  const [identity, setIdentity] = useState("");
  const [pin, setPin] = useState("");
  return (
    <>
      <PageHeading
        title="Secure Access to HakiArdhi"
        subtitle="Role-based authentication for the National Land Registry."
      />
      <Card className="login-card section-gap">
        <div className="login-emblem">
          <Landmark size={26} />
        </div>
        <h2>Welcome to HakiArdhi</h2>
        <p className="muted">Sign in using your authorized account</p>
        <label className="field-label">Access category</label>
        <select
          className="text-input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option>Government Staff</option>
          <option>Registered Landowner / Citizen</option>
          <option>Public Title Verification</option>
        </select>
        <label className="field-label">National ID / Staff Number</label>
        <input
          className="text-input"
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          placeholder="Enter your ID number"
        />
        <label className="field-label">Password / PIN</label>
        <input
          className="text-input"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter password or PIN"
        />
        <button
          className="btn primary full-width"
          onClick={() =>
            setMessage(
              identity && pin
                ? `Demo authentication only for ${role}. Credentials have not been verified.`
                : "Please enter both ID and password/PIN.",
            )
          }
        >
          Authenticate securely <ArrowRight size={15} />
        </button>
        {message && <div className="notice">{message}</div>}
        <div className="login-security">
          <LockKeyhole size={15} /> Prototype only. No real credentials are
          collected or authenticated.
        </div>
      </Card>
    </>
  );
}
