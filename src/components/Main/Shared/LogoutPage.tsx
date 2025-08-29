import { useEffect } from "react";
import { logout } from "../../../lib/api";
import { Link } from "react-router-dom";

export default function LogoutPage() {
  useEffect(() => {(async () => {await logout();})();}, []);
  return <p>Signed out. <Link className="menu-item" to="/home" >Log in</Link></p>;
}
