import '../../../Dark.css'
import {useCurrentUser} from "../../Shared/Authentication.ts";

const UserSettingsForm = ({onClose}: { onClose: () => void }) => {
    const handleSubmit = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        // Handle form submission
        onClose(); // Close modal window
    };
    const user = useCurrentUser();

    return (
        <div>
            <h2>User Settings</h2>
            <form onSubmit={handleSubmit}>
                <table className="table">
                    <tbody>
                    <tr>
                        <td className={"edit-td-header"}>Name:</td>
                        <td className={"edit-td-data"}><input name={"name"} value={user?.name}/></td>
                    </tr>
                    <tr>
                        <td className={"edit-td-header"}>Username:</td>
                        <td className={"edit-td-data"}><input name={"username"} value={user?.username}/></td>
                    </tr>
                    <tr>
                        <td className={"edit-td-header"}>Password</td>
                        <td className={"edit-td-data"}><input name={"password"} type={"password"}/></td>
                    </tr>
                    <tr>
                        <td className={"edit-td-header"}>Repeat Password:</td>
                        <td className={"edit-td-data"}><input name={"repeat_password"} type={"password"}/></td>
                    </tr>
                    <tr>
                        <td className={"edit-td-header"}>Theme:</td>
                        <td className={"edit-td-data"}>
                            <select name={"theme"}>
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td className={"edit-td-header"}>Avatar URL:</td>
                        <td className={"edit-td-data"}><input name={"avatar"}/></td>
                    </tr>
                    <tr>
                        <td colSpan={2}>
                            <button type="button" onClick={onClose}>Delete User</button>
                            <button type="button" onClick={onClose}>Cancel</button>
                            <button type="submit">Save</button>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </form>
        </div>
    );
}

export default UserSettingsForm;