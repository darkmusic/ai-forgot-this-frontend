import '../../../Dark.css'
import HomeWidget from "../Shared/HomeWidget.tsx";
import UserProfileWidget from "../Shared/UserProfileWidget.tsx";

const ViewCard = () => {
    return (
        <div>
            <HomeWidget/>
            <UserProfileWidget />
            <h2>View Card</h2>
        </div>
    )
}

export default ViewCard;