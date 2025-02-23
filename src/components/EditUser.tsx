import {useLocation, useNavigate} from 'react-router-dom';
import '../Admin.css';

function editPasswordRows() {
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

function addPasswordRows() {
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

function deleteButton() {
    return (
        <button>Delete User</button>
    );
}


function EditUser() {
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
                <h2>Ai Forgot These Cards - {user.id > 0 ? "Edit" : "Add"} User</h2>
                <table className={'table'}>
                    <thead>
                    <tr className={'table-header'}>
                        <th colSpan={2}>{user.id > 0 ? "Editing" : "Adding new"} user{user.id > 0 ? ": " + user.id : ""}</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td className={"edit-td-header"}>Name:</td>
                        <td className={"edit-td-data"}><input name={"name"}
                                                              defaultValue={user.id > 0 ? user.name : ""}/></td>
                    </tr>
                    <tr>
                        <td className={"edit-td-header"}>Username:</td>
                        <td className={"edit-td-data"}><input name={"username"}
                                                              defaultValue={user.id > 0 ? user.username : ""}/></td>
                    </tr>
                    {user.id > 0 ? editPasswordRows() : addPasswordRows()}
                    <tr>
                        <td className={"edit-td-header"}>Role:</td>
                        <td className={"edit-td-data"}>
                            <select name={"role"} defaultValue={user.id > 0 ? user.role : "user"}>
                                <option value={"user"}>User</option>
                                <option value={"admin"}>Admin</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td className={"edit-td-header"}>Active:</td>
                        <td className={"edit-td-data"}>
                            <select name={"active"} defaultValue={user.id > 0 ? user.active : "true"}>
                                <option value={"true"}>True</option>
                                <option value={"false"}>False</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={2}>
                            {user.id > 0 ? deleteButton() : ""}
                            <button onClick={cancelRoute}>Cancel</button>
                            <button>{user.id > 0 ? "Save" : "Add"}</button>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default EditUser;