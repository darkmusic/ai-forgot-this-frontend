import {Link, useNavigate} from 'react-router-dom';
import '../../Dark.css';
import { USERS, AI_MODELS, User, AiModel } from "../../constants/data/data.ts";
import UserProfileWidget from "../Main/Shared/UserProfileWidget.tsx";
import HomeWidget from "../Main/Shared/HomeWidget.tsx";

const UserRow = ({ user }: { user: User | null }) => {
    const navigate = useNavigate();
    return (
        <tr>
            <td className={'table-data'}>
                <a className={"link-pointer"} onClick={() => navigate('/admin/edit-user', { state: { user: user } })}>
                    {user === null ? "<new>" : user.username}
                </a>
            </td>
            <td className={'table-data'}>
                <a className={"link-pointer"} onClick={() => navigate('/admin/edit-user', { state: { user: user } })}>
                    {user === null ? "<new>" : user.username}
                </a>
            </td>
        </tr>
    );
};

const AiModelRow = ({ aiModel }: { aiModel: AiModel | null}) => {
    return (
        <tr>
            <td className={'table-data'}>{aiModel === null ? "<new>" : aiModel.name}</td>
            <td className={'table-data'}>{aiModel === null ? "<new>" : aiModel.model}</td>
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
            <td className={'table-data'}>
                <Link to="/admin/add-model" className={"link-pointer"}>
                    {"<new>"}
                </Link>
            </td>
        </tr>
    );
};

const Users = () => {
    return (
        <table className={'table'}>
            <thead>
            <tr className={'table-header'}>
                <th colSpan={2}>Users - List</th>
            </tr>
            <tr className={'table-column-header'}>
                <th>Name</th>
                <th>Username</th>
            </tr>
            </thead>
            <tbody>
            {USERS.map((user) => {
                return <UserRow key={user.username} user={user} />;
            })}
            <UserRow key={"<new>"} user={null} />
            </tbody>
        </table>
    );
}

const AiModels = () => {
    return (
        <table className={'table'}>
            <thead>
            <tr className={'table-header'}>
                <th colSpan={2}>AI Models - List</th>
            </tr>
            <tr className={'table-column-header'}>
                <th>Name</th>
                <th>Model</th>
            </tr>
            </thead>
            <tbody>
            <AiModelNewRow/>
            {AI_MODELS.map((aiModel) => {
                return <AiModelRow key={aiModel.model} aiModel={aiModel} />;
            })}
            </tbody>
        </table>
    );
}

const Admin = () => {
    return (
        <>
            <div>
                <HomeWidget/>
                <UserProfileWidget />
                <h2>Ai Forgot These Cards - Admin</h2>
                <Users />
                <br />
                <br />
                <AiModels />
            </div>
        </>
    );
}

export default Admin;