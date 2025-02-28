import {useLocation, useNavigate} from 'react-router-dom';
import '../../Dark.css';
import UserProfileWidget from "../Main/Shared/UserProfileWidget.tsx";

const editPasswordRows = () => {
    return (
        <>
            <tr>
                <td colSpan={2} className={"small-text-hint"}>*Leave password blank to keep the same
                    password.*
                </td>
            </tr>
            <tr>
                <td className={"edit-td-header"}>New password:</td>
                <td className={"edit-td-data"}><input name={"password"} type={"password"}/></td>
            </tr>
        </>
    );
}

const addPasswordRows = () => {
    return (
        <>
            <tr>
                <td className={"edit-td-header"}>Password:</td>
                <td className={"edit-td-data"}><input name={"password"} type={"password"}/></td>
            </tr>
            <tr>
                <td className={"edit-td-header"}>Repeat Password:</td>
                <td className={"edit-td-data"}><input name={"repeat_password"} type={"password"}/></td>
            </tr>
        </>
    );
}

const deleteButton = () => {
    return (
        <button>Delete User</button>
    );
}


const EditUser = () => {
    const location = useLocation();
    const {user} = location.state || {};
    const navigate = useNavigate();
    const cancelRoute = () => {
        const path = '/admin';
        navigate(path);
    }

    return (
        <>
            <div>
                <UserProfileWidget />
                <h2>Ai Forgot These Cards - {user !== null ? "Edit" : "Add"} User</h2>
                <table className={'table'}>
                    <thead>
                    <tr className={'table-header'}>
                        <th colSpan={2}>{user !== null ? "Editing" : "Adding new"} user{user !== null ? ": " + user.id : ""}</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td className={"edit-td-header"}>Name:</td>
                        <td className={"edit-td-data"}><input name={"name"}
                                                              defaultValue={user !== null ? user.name : ""}/></td>
                    </tr>
                    <tr>
                        <td className={"edit-td-header"}>Username:</td>
                        <td className={"edit-td-data"}><input name={"username"}
                                                              defaultValue={user !== null ? user.username : ""}/></td>
                    </tr>
                    {user != null ? editPasswordRows() : addPasswordRows()}
                    <tr>
                        <td className={"edit-td-header"}>Role:</td>
                        <td className={"edit-td-data"}>
                            <select name={"role"} defaultValue={user !== null ? user.role : "user"}>
                                <option value={"user"}>User</option>
                                <option value={"admin"}>Admin</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td className={"edit-td-header"}>Active:</td>
                        <td className={"edit-td-data"}>
                            <select name={"active"} defaultValue={user !== null ? user.active : "true"}>
                                <option value={"true"}>True</option>
                                <option value={"false"}>False</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={2}>
                            {user !== null ? deleteButton() : ""}
                            <button onClick={cancelRoute}>Cancel</button>
                            <button>{user !== null ? "Save" : "Add"}</button>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default EditUser;