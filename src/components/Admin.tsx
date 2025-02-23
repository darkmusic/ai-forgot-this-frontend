import {Link, useNavigate } from 'react-router-dom';
import '../Admin.css';
import { USERS, AI_MODELS, User, AiModel } from "../constants/data/data.ts";

const UserRow = ({ user }: { user: User }) => {
    const navigate = useNavigate();
    return (
        <tr>
            <td className={'table-data'}>
                <a className={"link-pointer"} onClick={() => navigate('/admin/edit-user', { state: { user: user } })}>
                    {user.username}
                </a>
            </td>
            <td className={'table-data'}>
                <a className={"link-pointer"} onClick={() => navigate('/admin/edit-user', { state: { user: user } })}>
                    {user.username}
                </a>
            </td>
        </tr>
    );
};

const AiModelRow = ({ aiModel }: { aiModel: AiModel }) => {
    return (
        <tr>
            <td className={'table-data'}>{aiModel.name}</td>
            <td className={'table-data'}>{aiModel.model}</td>
        </tr>
    );
};

const AiModelNewRow = ({ aiModel }: { aiModel: AiModel }) => {
    return (
        <tr>
            <td className={'table-data'}>
                <Link to="/admin/add-model" className={"link-pointer"}>
                    {aiModel.name}
                </Link>
            </td>
            <td className={'table-data'}>
                <Link to="/admin/add-model" className={"link-pointer"}>
                    {aiModel.name}
                </Link>
            </td>
        </tr>
    );
};

function Users() {
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
            </tbody>
        </table>
    );
}

function AiModels() {
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
            {AI_MODELS.map((aiModel) => {
                if (aiModel.id === 0) {
                    return <AiModelNewRow key={aiModel.model} aiModel={aiModel} />;
                }
                return <AiModelRow key={aiModel.model} aiModel={aiModel} />;
            })}
            </tbody>
        </table>
    );
}

function Admin() {
    return (
        <>
            <div>
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