import { useEffect } from "react";
import { useAppDispatch } from "../app/hooks";
import { checkAuth } from "../app/slice/authslice";
import { useSelector } from "react-redux";

export default function AuthInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const isAuthed = useSelector((state: any) => state.auth.isAuthenticated);

  useEffect(() => {
    console.log("IsAuthed", isAuthed);
    
    if(isAuthed){
      dispatch(checkAuth());
    }
  }, [dispatch]);

  return children;
}