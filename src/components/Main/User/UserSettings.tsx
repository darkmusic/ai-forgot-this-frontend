import { Theme, User } from '../../../constants/data/data.ts';
import '../../../css/themes.css'
import {useCurrentUser} from "../../Shared/Authentication.ts";
import { fetchThemes } from '../../Shared/ThemeUtility.ts';
import { useState, useMemo, useEffect, ChangeEvent } from "react";
import { hashPassword } from '../../Shared/Authentication.ts';
import {TOMCAT_SERVER_URL} from '../../../constants/router/router.tsx';

const UserSettingsForm = ({onClose}: { onClose: () => void }) => {
    const [themes, setThemes] = useState([] as Theme[]);
    const [fetchedThemes, setFetchedThemes] = useState(false);
    var user = useCurrentUser();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        repeat_password: '',
        themeId: 1,
        profile_pic_url: ''
    });

    // Initialize formData with user data if available
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                username: user.username || '',
                password: '', // Password should not be pre-filled for security reasons
                repeat_password: '',
                themeId: user.themeId || 1,
                profile_pic_url: user.profile_pic_url || ''
            });
        }
    }, [user]);

    // Move the fetch logic to useEffect to avoid side effects in render
    useEffect(() => {
        if (!fetchedThemes) {
            fetchThemes().then((themes) => {
                setThemes(themes);
                setFetchedThemes(true);
            });
        }
    }, [fetchedThemes]);    // Move useMemo before any conditional returns

    const themeOptions = useMemo(() => {
        if (!Array.isArray(themes)) {
            return [];
        }
        return themes.map((theme) => (
            <option key={theme.id} value={theme.id}>
                {theme.name}
            </option>
        ));
    }, [themes]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();

        // Validate form data
        if (user === null) {
            alert("User is not logged in");
            return;
        }

        if (formData.password !== formData.repeat_password) {
            alert("Passwords do not match");
            return;
        }

        if (formData.name.length === 0 || formData.username.length === 0 || formData.profile_pic_url.length === 0) {
            alert("Please fill in all fields");
            return;
        }

        if (formData.themeId <= 0) {
            alert("Please select a valid theme");
            return;
        }

        if (formData.profile_pic_url.length > 255) {
            alert("Avatar URL is too long");
            return;
        }

        if (formData.username.length > 50) {
            alert("Username is too long");
            return;
        }

        if (formData.name.length > 50) {
            alert("Name is too long");
            return;
        }

        // If password is provided, check its length
        if (formData.password.length > 0 && formData.password.length < 8) {
            alert("Password must be at least 8 characters long");
            return;
        }

        // If repeat_password is provided, check its length
        if (formData.repeat_password.length > 0 && formData.repeat_password.length < 8) {
            alert("Repeat password must be at least 8 characters long");
            return;
        }


        // If password is provided, hash it
        let hashedPassword = '';
        if (formData.password.length > 0) {
            hashedPassword = await hashPassword(formData.password);
        }

        // Update user data
        const updatedUser : User = {
            ...user,
            name: formData.name,
            username: formData.username,
            password_hash: hashedPassword || user.password_hash, // Use existing password hash if not changed
            themeId: formData.themeId,
            profile_pic_url: formData.profile_pic_url
        };

        // Send updated user data to the server
        fetch(TOMCAT_SERVER_URL + `/api/user/${user.id}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedUser)
        }).then((response) => {
            if (response.ok) {
              onClose(); // Close modal window
            }
            else {
                alert("Failed to update user settings");
            }
        }
        ).catch((error) => {
            console.error("Error updating user settings:", error);
            alert("An error occurred while updating user settings");
        });
    };

    // Early return after all hooks are called
    if (!user || !user.profile_pic_url || user.profile_pic_url.length === 0) {
        return <div>Loading user profile...</div>
    }

    return (
        <div>
            <h2>User Settings</h2>
            <form onSubmit={handleSubmit}>
                <table className="table">
                    <tbody>
                    <tr>
                        <td className={"edit-td-header"}>Name:</td>
                        <td className={"edit-td-data"}><input name={"name"} defaultValue={user.name} onChange={handleChange}/></td>
                    </tr>
                    <tr>
                        <td className={"edit-td-header"}>Username:</td>
                        <td className={"edit-td-data"}><input name={"username"} defaultValue={user.username} onChange={handleChange}/></td>
                    </tr>
                    <tr>
                        <td className={"edit-td-header"}>Password</td>
                        <td className={"edit-td-data"}><input name={"password"} onChange={handleChange}/></td>
                    </tr>
                    <tr>
                        <td className={"edit-td-header"}>Repeat Password:</td>
                        <td className={"edit-td-data"}><input name={"repeat_password"} type={"password"} onChange={handleChange}/></td>
                    </tr>
                    <tr>
                        <td className={"edit-td-header"}>Theme:</td>
                        <td className={"edit-td-data"}>
                            <select name={"themeId"} defaultValue={user.themeId ?? 1} onChange={handleChange}>
                                {themeOptions}
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td className={"edit-td-header"}>Avatar URL:</td>
                        <td className={"edit-td-data"}><input name={"avatar"} defaultValue={user.profile_pic_url} onChange={handleChange}/></td>
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