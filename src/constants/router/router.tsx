import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from "react-router-dom";
import Admin from "../../components/Admin";
import EditUser from "../../components/EditUser.tsx";
import AddModel from "../../components/AddModel.tsx";

const ROUTES = [
    {
      path: "/",
      element: <meta httpEquiv="refresh" content="0;url=/admin" />
    },
    {
        path: "/admin",
        element: <Admin/>
    },
    {
        path: "/admin/edit-user",
        element: <EditUser/>
    },
    {
        path: "/admin/add-model",
        element: <AddModel/>
    }
];

export const router = createBrowserRouter(
    createRoutesFromElements(ROUTES.map((route) => {
        return <Route path={route.path} element={route.element} />;
    }))
);