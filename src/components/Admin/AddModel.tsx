import '../../Dark.css'
import {useNavigate} from "react-router-dom";
import UserProfileWidget from "../Main/Shared/UserProfileWidget.tsx";

const AddModel = () => {
    const navigate = useNavigate();
    const cancelRoute = () => {
        const path = '/admin';
        navigate(path);
    }

    return (
        <>
            <UserProfileWidget />
            <div>
                <h2>Ai Forgot These Cards - Add Model</h2>
                <p>Adding model</p>
            </div>
            <table className={'table'}>
                <thead>
                <tr className={'table-header'}>
                    <th colSpan={2}>Add/Pull Model</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td className={"edit-td-header"}>Model:</td>
                    <td><input name={"model"} size={60} /></td>
                </tr>
                <tr>
                    <td className={"edit-td-header"}>Ollama Log</td>
                    <td><textarea name={"ollamaLog"} rows={10} cols={60}/></td>
                </tr>
                <tr>
                    <td className={"table-data"} colSpan={2}>
                        <button onClick={cancelRoute}>Cancel</button>
                        <button>Pull / Add</button>
                    </td>
                </tr>
                </tbody>
            </table>
        </>
    );
}

export default AddModel;