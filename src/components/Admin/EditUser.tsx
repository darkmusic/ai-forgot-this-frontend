import {useLocation, useNavigate} from 'react-router-dom';
import '../../css/themes.css';
import UserProfileWidget from "../Main/Shared/UserProfileWidget.tsx";
import {ChangeEvent, ChangeEventHandler, FormEvent, useState} from "react";
import {hashPassword, useCurrentUser} from "../Shared/Authentication.ts";
import {User} from "../../constants/data/data.ts";
import {TOMCAT_SERVER_URL} from '../../constants/router/router.tsx';

const editPasswordRows = (handleChange: ChangeEventHandler<HTMLInputElement> | undefined) => {
    return (
        <>
            <tr>
                <td colSpan={2} className={"small-text-hint"}>*Leave password blank to keep the same password.*</td>
            </tr>
            <tr>
                <td className={"edit-td-header"}>New password:</td>
                <td className={"edit-td-data"}><input name={"password"} type={"password"} onChange={handleChange}/></td>
            </tr>
        </>
    );
}

const addPasswordRows = (handleChange: ChangeEventHandler<HTMLInputElement> | undefined) => {
    return (
        <>
            <tr>
                <td className={"edit-td-header"}>Password:</td>
                <td className={"edit-td-data"}><input name={"password"} type={"password"} onChange={handleChange}/></td>
            </tr>
            <tr>
                <td className={"edit-td-header"}>Repeat Password:</td>
                <td className={"edit-td-data"}><input name={"repeat_password"} type={"password"} onChange={handleChange}/></td>
            </tr>
        </>
    );
}

const EditUser = () => {
    const navigate = useNavigate();
    const [canceling, setCanceling] = useState(false);
    const cancelRoute = () => {
        setCanceling(true);
        const path = '/admin';
        navigate(path);
    };
    const [deleting, setDeleting] = useState(false);
    const loggedInUser = useCurrentUser();
    const { state } = useLocation();
    const userBeingEdited = state?.user as User;

    const [formData, setFormData] = useState({
        name: userBeingEdited !== null ? userBeingEdited.name : "",
        username: userBeingEdited !== null ? userBeingEdited.username : "",
        password: "",
        repeat_password: "",
        role: userBeingEdited !== null && userBeingEdited.admin ? "admin" : "user",
        active: userBeingEdited !== null && !userBeingEdited.active ? "false" : "true",
        profile_pic_url: userBeingEdited !== null ? userBeingEdited.profile_pic_url : ""
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleDelete = () => {
        if (loggedInUser === null) {
            alert("User is not logged in");
            return;
        }

        setDeleting(true);
        if (userBeingEdited === null) {
            setDeleting(false);
            return;
        }
        // Show confirmation message
        if (!confirm(`Are you sure you want to delete user ${userBeingEdited.id}?`)) {
            setDeleting(false);
            return;
        }

        fetch(TOMCAT_SERVER_URL + `/api/user/${userBeingEdited.id}`, {
            method: "DELETE"
        }).then((response) => {
            if (response.ok) {
                setDeleting(false);
                navigate("/admin");
            }
            else {
                setDeleting(false);
                alert("Failed to delete user");
            }
        });
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (deleting) return;
        if (canceling) return;

        if (loggedInUser === null) {
            alert("User is not logged in");
            return;
        }

        // Validate password (for new users only)
        if (userBeingEdited === null && formData.password !== formData.repeat_password) {
            alert("Passwords do not match");
            return;
        }

        // If user is being added, ensure password is provided
        if (userBeingEdited === null && !formData.password) {
            alert("Password is required");
            return;
        }

        // If password was provided, create a cryptographic hash of it
        let hash = "";
        if (formData.password) {
            hash = await hashPassword(formData.password);
        }

        // Build the user object
        const userBeingEditedObj : User = {
            id: userBeingEdited?.id || null,
            username: formData.username,
            password_hash: hash,
            name: formData.name,
            decks: [],
            admin: formData.role === "admin",
            active: formData.active === "true",
            profile_pic_url: formData.profile_pic_url
        };

        // Send the user object to the server
        fetch(userBeingEditedObj.id === null ? TOMCAT_SERVER_URL + "/api/user" : TOMCAT_SERVER_URL + `/api/user/${userBeingEditedObj.id}`, {
            method: userBeingEditedObj.id === null ? "POST" : "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userBeingEditedObj)
        }).then((response) => {
            if (response.ok) {
                navigate("/admin");
            }
            else {
                alert("Failed to save user");
            }
        });
    }

    return (
        <>
            <div>
                <UserProfileWidget user={loggedInUser as User} />
                <h2>Ai Forgot These Cards - {userBeingEdited !== null ? "Edit" : "Add"} User</h2>
                <form onSubmit={handleSubmit}>
                <table className={'table'}>
                    <thead>
                    <tr className={'table-header'}>
                        <th colSpan={2}>{userBeingEdited !== null ? "Editing" : "Adding new"} user{userBeingEdited !== null ? ": " + userBeingEdited.id : ""}</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td className={"edit-td-header"}>Name:</td>
                        <td className={"edit-td-data"}><input name={"name"} onChange={handleChange} value={formData.name}/></td>
                    </tr>
                    <tr>
                        <td className={"edit-td-header"}>Username:</td>
                        <td className={"edit-td-data"}><input name={"username"} onChange={handleChange} value={formData.username}/></td>
                    </tr>
                    {userBeingEdited !== null ? editPasswordRows(handleChange) : addPasswordRows(handleChange)}
                    <tr>
                        <td className={"edit-td-header"}>Profile Pic URL (32x32 preferred):</td>
                        <td className={"edit-td-data"}><input name={"profile_pic_url"} onChange={handleChange} value={formData.profile_pic_url}/></td>
                    </tr>
                    <tr>
                        <td className={"edit-td-header"}>Role:</td>
                        <td className={"edit-td-data"}>
                            <select name={"role"} onChange={handleChange} value={formData.role}>
                                <option value={"user"}>User</option>
                                <option value={"admin"}>Admin</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td className={"edit-td-header"}>Active:</td>
                        <td className={"edit-td-data"}>
                            <select name={"active"} onChange={handleChange} value={formData.active}>
                                <option value={"true"}>True</option>
                                <option value={"false"}>False</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={2}>
                            {userBeingEdited !== null ? <button onClick={handleDelete}>Delete User</button> : ""}
                            <button onClick={cancelRoute}>Cancel</button>
                            <button>{userBeingEdited !== null ? "Save" : "Add"}</button>
                        </td>
                    </tr>
                    </tbody>
                </table>
                </form>
            </div>
        </>
    );
}

export default EditUser;