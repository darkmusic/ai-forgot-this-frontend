import {Link, useNavigate} from 'react-router-dom';
import '../../css/themes.css';
import {AiModel, User} from "../../constants/data/data.ts";
import UserProfileWidget from "../Main/Shared/UserProfileWidget.tsx";
import HomeWidget from "../Main/Shared/HomeWidget.tsx";
import {useState} from "react";
import {useCurrentUser} from "../Shared/Authentication.ts";
import {fetchModels} from "../Shared/AiUtility.ts";

const UserRow = ({ user }: { user: User | null }) => {
    const navigate = useNavigate();
    return (
        <tr>
            <td className={'table-data'}>
                <a className={"link-pointer"} onClick={() => navigate('/admin/edit-user', { state: { user: user } })}>
                    {user === null ? "<new>" : user.name}
                </a>
            </td>
            <td className={'table-data'}>
                <a className={"link-pointer"} onClick={() => navigate('/admin/edit-user', { state: { user: user } })}>
                    {user === null ? "<new>" : user.username}
                </a>
            </td>
            <td className={'table-data'}>
                <a className={"link-pointer"} onClick={() => navigate('/admin/edit-user', { state: { user: user } })}>
                    {user === null ? "<new>" : (user.admin ? "Yes" : "No")}
                </a>
            </td>
            <td className={'table-data'}>
                <a className={"link-pointer"} onClick={() => navigate('/admin/edit-user', { state: { user: user } })}>
                    {user === null ? "<new>" : (user.active ? "Yes" : "No")}
                </a>
            </td>
        </tr>
    );
};

const AiModelRow = ({ aiModel }: { aiModel: AiModel | null}) => {
    return (
        <tr>
            <td className={'table-data'}>{aiModel === null ? "<new>" : aiModel.name}</td>
        </tr>
    );
};

const AiModelNewRow = () => {
    return (
        <tr>
            <td className={'table-data'}>
                <Link to="/admin/add-model" className={"link-pointer"}>
                    {"<new>"}
                </Link>
            </td>
        </tr>
    );
};

const fetchUsers = async () : Promise<User[]> => {
    const response = await fetch('/api/user/all');
    return await response.json();
}

const Users = () => {
    const [users, setUsers] = useState([] as User[]);
    const [fetchedUsers, setFetchedUsers] = useState(false);
    if (!fetchedUsers) {
        fetchUsers().then((users) => setUsers(users))
            .then(() => setFetchedUsers(true));
    }

    if (users === null || users.length === 0) {
        return <div>Loading users...</div>
    }

    return (
        <table className={'table'}>
            <thead>
            <tr className={'table-header'}>
                <th colSpan={4}>Users - List</th>
            </tr>
            <tr className={'table-column-header'}>
                <th>Name</th>
                <th>Username</th>
                <th>Admin</th>
                <th>Active</th>
            </tr>
            </thead>
            <tbody>
            {users?.map((user) => {
                return <UserRow key={user.username} user={user} />;
            })}
            <UserRow key={"<new>"} user={null} />
            </tbody>
        </table>
    );
}

const AiModels = () => {
    const [aiModels, setAiModels] = useState([] as AiModel[]);
    const [fetchedAiModels, setFetchedAiModels] = useState(false);
    if (!fetchedAiModels) {
        fetchModels().then((models) => setAiModels(models))
            .then(() => setFetchedAiModels(true));
    }

    return (
        <table className={'table'}>
            <thead>
            <tr className={'table-header'}><th colSpan={2}>AI Models - List</th></tr>
            <tr className={'table-column-header'}><th>Name</th></tr>
            </thead>
            <tbody>
            <AiModelNewRow/>
            {aiModels?.map((aiModel : AiModel) => {
                return <AiModelRow key={aiModel.model} aiModel={aiModel} />;
            })}
            </tbody>
        </table>
    );
}

const Admin = () => {
    const user = useCurrentUser();

    if (!user) {
        return <div>Loading user profile...</div>
    }

    return (
        <div>
            <HomeWidget/>
            <UserProfileWidget user={user} />
            <h2>Ai Forgot These Cards - Admin</h2>
            <Users />
            <br />
            <br />
            <AiModels />
        </div>
    );
}

export default Admin;