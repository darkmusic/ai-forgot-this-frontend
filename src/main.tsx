import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router'
import {router} from "./constants/router/router.tsx";

createRoot(document.getElementById('root')!).render(
  <div className={'app'}>
    <RouterProvider router={router} />
  </div>
)
