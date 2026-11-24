import { useEffect } from "react";
import { useAppDispatch } from "../app/hooks";
import { checkAuth } from "../app/slice/authslice";

export default function AuthInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (window.location.pathname !== "/") {
      dispatch(checkAuth());
    }
  }, [dispatch]);

  return children;
}
