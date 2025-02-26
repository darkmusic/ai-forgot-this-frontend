import '../Dark.css';
import {useAuth} from "./Authentication.ts";
import {useState} from 'react';
import UserSettingsForm from './UserSettings';
import * as React from "react";
import {User} from "../constants/data/data.ts";
import {useNavigate} from "react-router-dom";

const UserProfile = (props: { user: User }) => {
    return (
        <div className="user-profile">
            <img src={props.user.avatar} alt={props.user.name}/>
            <h2>{props.user.name}</h2>
        </div>
    );
}

const Modal = ({isOpen, onClose, children}: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>&times;</button>
                {children}
            </div>
        </div>
    );
}

const UserProfileMenu = ({onSettingsClick, user}: { onSettingsClick: () => void, user: User}) => {
    const navigate = useNavigate();
    const adminRoute = () => {
        const path = '/admin';
        navigate(path);
    }

    return (
        <div className="profile-menu">
            <a className="menu-item" onClick={onSettingsClick}>Settings...</a>
            {user.isAdmin && <a className="menu-item" onClick={adminRoute}>Admin</a>}
            <a className="menu-item">Log out</a>
        </div>
    );
}

const UserProfileWidget = () => {
    const user = useAuth();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <>
            <div className="user-profile-widget">
                <div className="profile-container">
                    <UserProfile user={user}/>
                    <UserProfileMenu onSettingsClick={() => setIsSettingsOpen(true)} user={user}/>
                </div>
            </div>
            <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
                <UserSettingsForm onClose={() => setIsSettingsOpen(false)}/>
            </Modal>
        </>
    );
}

export default UserProfileWidget;