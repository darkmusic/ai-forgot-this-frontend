import { createRoot } from "react-dom/client";
import "katex/dist/katex.min.css";
import "./css/index.css";
import "./css/themes.css";
import { RouterProvider } from "react-router";
import { router } from "./constants/router/router.tsx";

createRoot(document.getElementById("root")!).render(
  <div className={"app"}>
    <RouterProvider router={router} />
  </div>
);
