import '../../css/themes.css'
import {useNavigate} from "react-router-dom";
import UserProfileWidget from "../Main/Shared/UserProfileWidget.tsx";
import {useState} from "react";
import * as React from "react";
import {useCurrentUser} from "../Shared/Authentication.ts";

const pullModel = async (modelName : string) => {
    const ollamaLog = document.getElementById("ollamaLog");
    ollamaLog!.innerText += "Pulling model, please wait. This may take a while!\n";

    const response = await fetch(`/api/ai/model/pull?modelName=${modelName}`);
    if (!response.body) {
        throw new Error('ReadableStream not yet supported in this browser.');
    }
    const reader = response.body.getReader();

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Convert the byte array to text
        const text = new TextDecoder().decode(value);
        const progressEvents = text.split('\n')
            .filter(line => line.trim())
            .map(line => {
                if (!line.trim()) return null;
                return line;
              }
            );

        // Handle each progress event
        progressEvents.forEach(event => {
            console.log(event);
            // Update your UI with the progress information
            ollamaLog!.innerText += event + "\n";
        });
    }
};

const AddModel = () => {
    const navigate = useNavigate();
    const adminRoute = () => {
        const path = '/admin';
        navigate(path);
    }
    const [model, setModel] = useState<string>('');
    const user = useCurrentUser();

    if (!user) {
        return <div>Loading user profile...</div>
    }

    const handleModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setModel(event.target.value);
    }

    const syncModels = () => {
        fetch(`/api/ai/models/sync`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
            })
            .then(data => {
                console.log(data);
                adminRoute();
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
            });
    }

    return (
        <>
            <UserProfileWidget user={user} />
            <div>
                <h2>Ai Forgot These Cards - Add Model</h2>
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
                    <td><input name={"model"} size={60} onChange={handleModelChange} /></td>
                </tr>
                <tr>
                    <td className={"edit-td-header"}>Ollama Log</td>
                    <td><textarea name={"ollamaLog"} id={"ollamaLog"} rows={10} cols={60}/></td>
                </tr>
                <tr>
                    <td className={"table-data"} colSpan={2}>
                        <button onClick={adminRoute}>Cancel</button>
                        <button onClick={() => pullModel(model)}>Pull</button>
                        <button onClick={() => syncModels()}>Add</button>
                    </td>
                </tr>
                </tbody>
            </table>
        </>
    );
}

export default AddModel;