import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  redirect,
} from "react-router-dom";
import Admin from "../../components/Admin/Admin.tsx";
import EditUser from "../../components/Admin/EditUser.tsx";
import Home from "../../components/Main/Home/Home.tsx";
import EditDeck from "../../components/Main/Deck/EditDeck.tsx";
import ViewCard from "../../components/Main/Card/ViewCard.tsx";
import EditCard from "../../components/Main/Card/EditCard.tsx";
import Review from "../../components/Main/Review/Review.tsx";
import Cram from "../../components/Main/Cram/Cram.tsx";
import { primeCsrf, login as apiLogin, getJson, apiFetch } from "../../lib/api";
import LoginPage from "../../components/Main/Shared/LoginPage.tsx";
import LogoutPage from "../../components/Main/Shared/LogoutPage.tsx";
import NotFoundPage from "../../components/Main/Shared/404Page.tsx";

// Runs once per app load / navigation to root—good place to prime CSRF
export async function rootLoader() {
  await primeCsrf();

  // Decide the initial landing page based on authentication.
  // Use apiFetch so we can branch on status codes without relying on exceptions.
  const res = await apiFetch("/api/current-user", { method: "GET" });
  return res.ok ? redirect("/home") : redirect("/login");
}

// Protect routes with a loader
export async function requireAuthLoader({ request }: { request: Request }) {
  try {
    await getJson("/api/current-user");
    return null;
  } catch {
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;
    throw redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }
}

// Handles the login form POST
export async function loginAction({ request }: { request: Request }) {
  const form = await request.formData();
  const ok = await apiLogin(
    String(form.get("username") || ""),
    String(form.get("password") || "")
  );
  if (!ok) {
    // Let the LoginPage component show an error
    return { error: "Invalid username or password." };
  }
  // On success, redirect to the intended page or home
  const url = new URL(request.url);
  return redirect(url.searchParams.get("redirectTo") || "/home");
}

const ROUTES = [
  {
    path: "/",
    element: <div />,
    loader: rootLoader,
  },
  {
    path: "/admin",
    element: <Admin />,
    loader: requireAuthLoader,
  },
  {
    path: "/admin/edit-user",
    element: <EditUser />,
    loader: requireAuthLoader,
  },
  {
    path: "/home",
    element: <Home />,
    loader: requireAuthLoader,
  },
  {
    path: "/deck/edit",
    element: <EditDeck />,
    loader: requireAuthLoader,
  },
  {
    path: "/review",
    element: <Review />,
    loader: requireAuthLoader,
  },
  {
    path: "/cram",
    element: <Cram />,
    loader: requireAuthLoader,
  },
  {
    path: "/card/view",
    element: <ViewCard />,
    loader: requireAuthLoader,
  },
  {
    path: "/card/edit",
    element: <EditCard />,
    loader: requireAuthLoader,
  },
  {
    path: "/login/*",
    element: <LoginPage />,
    action: loginAction,
  },
  {
    path: "/logout/*",
    element: <LogoutPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
];

export const router = createBrowserRouter(
  createRoutesFromElements(
    ROUTES.map((route) => {
      return (
        <Route
          key={route.path}
          path={route.path}
          element={route.element}
          action={route.action}
          loader={route.loader}
        />
      );
    })
  )
);
