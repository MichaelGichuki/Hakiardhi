import { useState } from "react";
import { Card } from "../Components/Card";
import { ArrowRight, Landmark, LockKeyhole } from "lucide-react";
import { authApi } from "../service/auth";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { loginComplete } from "../app/slice/authslice";

export function LoginPage({
  message,
  setMessage,
}: {
  message: string;
  setMessage: (v: string) => void;
}) {

  const navigate = useNavigate();
  const dispatch = useDispatch();
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
      const res = await authApi.signin({
        email: identity,
        password: pin,
      });
      dispatch(loginComplete(res.data.user))
      switch(res.data.user.role){
        case "Admin":
          navigate('/dashboard')
          break;
          case "LandOwner":
            navigate('/landowner')
          break;            
        case "Registar":
          navigate('/audit');
          break;
        case "VerificationOfficer":
          navigate('/audit');
        break;
      }

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
        <button disabled={Boolean(isLoading)} className="btn primary full-width" onClick={handleLogin}>
          {!isLoading ? (
            <>
              Authenticate securely <ArrowRight size={15} />
            </>
          ) : (
            "Loading ..."
          )}
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
