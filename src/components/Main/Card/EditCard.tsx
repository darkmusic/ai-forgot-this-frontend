import '../../../Dark.css'
import HomeWidget from "../Shared/HomeWidget.tsx";
import UserProfileWidget from "../Shared/UserProfileWidget.tsx";

const EditCard = () => {
    return (
        <div>
            <HomeWidget/>
            <UserProfileWidget />
            <h2>Edit Card</h2>
        </div>
    )
}

export default EditCard;