import { useState } from "react";
import { Card } from "../Components/Card";
import { ArrowRight, Landmark, LockKeyhole } from "lucide-react";
import { authApi } from "../service/auth";
import { useNavigate } from "react-router";

export function LoginPage({
  message,
  setMessage,
}: {
  message: string;
  setMessage: (v: string) => void;
}) {

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<Boolean>(false)
  const [role, setRole] = useState("Landowner");
  const [identity, setIdentity] = useState("");
  const [pin, setPin] = useState("");

  const handleLogin = async () => {
    if(isLoading) return;

    if (identity == "" || pin == "") {
      setMessage("Please enter both ID and password/PIN.");
      return;
    }

    try {
      setIsLoading(true)
      await authApi.signin({
        email: identity,
        password: pin,
      });
      navigate('/dashboard')
    } catch (err) {
      setMessage(`Demo authentication only for ${role}. Credentials have not been verified.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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
          <option value={"Admin"}>Admin</option>
          <option value={"Registrar"}>Registrar</option>
          <option value={"Landowner"}>Landowner / Citizen</option>
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
        <button className="btn primary full-width" onClick={handleLogin}>
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
