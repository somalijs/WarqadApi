import FormSpinner from "@/Assets/FormSpinner";
import useAuth from "@/hooks/Auth/useAuth";
import useNavigateHook from "@/hooks/customs/useNavigateHook";
import { message } from "antd";
import axios from "axios";
import { useEffect, useLayoutEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export const Guard = () => {
  const location = useLocation();
  const { goToLogin } = useNavigateHook();

  const { login, setIsLoggedIn, setIsFetched, isFetched } = useAuth();
  useLayoutEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get("/api/v1/agents/me", {
          withCredentials: true, // 🔑 this allows cookies to be sent & received
        });

        login(res.data);
        setIsLoggedIn(true);
        setIsFetched(true);
      } catch (err: any) {
        console.error("❌ Login error:", err.response?.data || err.message);
        setIsFetched(true);
        setIsLoggedIn(false);
        goToLogin();
      }
    };
    fetch();
  }, [location.pathname, setIsFetched]);

  if (!isFetched) {
    return (
      <div className="min-h-screen">
        <FormSpinner />
      </div>
    );
  }
  return <Outlet />;
};
export const ProtectedRoute = () => {
  const { isLoggedIn } = useAuth();

  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

export const UnProtectedRoute = () => {
  const { isLoggedIn, user } = useAuth();

  return !isLoggedIn || !user ? <Outlet /> : <Navigate to={"/"} replace />;
};

export const AdminProtectedRoute = () => {
  const { user } = useAuth();

  const { role } = user!;
  useEffect(() => {
    if (!["admin"].includes(role)) {
      message.error("Only admin can access this page");
    }
  }, [role]);

  return ["admin"].includes(role) ? <Outlet /> : <Navigate to="/" replace />;
};

export const ManagerProtectedRoute = ({
  message = (e: any) => {
    console.log(e);
  },
}: {
  message: any;
}) => {
  const { user } = useAuth();

  const { role } = user!;

  useEffect(() => {
    if (!["admin", "manager"].includes(role)) {
      message.error("Only admin and manager can access this page");
    }
  }, [role]);

  return ["admin", "manager"].includes(role) ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
};
