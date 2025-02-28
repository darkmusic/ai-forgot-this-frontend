import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from "react-router-dom";
import Admin from "../../components/Admin/Admin.tsx";
import EditUser from "../../components/Admin/EditUser.tsx";
import AddModel from "../../components/Admin/AddModel.tsx";
import Home from "../../components/Main/Home/Home.tsx";
import EditDeck from "../../components/Main/Deck/EditDeck.tsx";
import Quiz from "../../components/Main/Card/Quiz.tsx";
import ViewCard from "../../components/Main/Card/ViewCard.tsx";
import EditCard from "../../components/Main/Card/EditCard.tsx";

const ROUTES = [
    {
      path: "/",
      element: <meta httpEquiv="refresh" content="0;url=/home" />
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
    },
    {
        path: "/home",
        element: <Home/>
    },
    {
        path: "/deck/edit",
        element: <EditDeck/>
    },
    {
        path: "/deck/edit",
        element: <EditDeck/>
    },
    {
        path: "/quiz",
        element: <Quiz/>
    },
    {
        path: "/card/view",
        element: <ViewCard/>
    },
    {
        path: "/card/edit",
        element: <EditCard/>
    }
];

export const router = createBrowserRouter(
    createRoutesFromElements(ROUTES.map((route) => {
        return <Route path={route.path} element={route.element} />;
    }))
);