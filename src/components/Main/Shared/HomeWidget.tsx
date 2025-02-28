import '../../../Dark.css'
import {useNavigate} from "react-router-dom";

const HomeWidget = () => {
    const navigate = useNavigate();
    const homeRoute = () => {
        const path = '/home';
        navigate(path);
    }

  return (
    <div>
        <button className={"nav-button"} onClick={homeRoute}>Home</button>
    </div>
  );
}

export default HomeWidget;