import "../../../css/themes.css";
import { useState } from "react";
import UserSettingsForm from "../User/UserSettings.tsx";
import * as React from "react";
import { User } from "../../../constants/data/data.ts";
import { useNavigate } from "react-router-dom";
import { switchTheme } from "../../Shared/ThemeUtility.ts";

const UserProfile = (props: { user: User }) => {
  const [themeChanged, setThemeChanged] = useState(false);

  // Check if the themeId is set and if the current document theme does not match the user's theme
  // Also ensure that the theme has not already been changed to avoid unnecessary updates
  if (props.user?.themeId !== undefined && props.user?.themeId !== null && document.documentElement.getAttribute("data-theme") !== props.user?.themeId.toString() && !themeChanged) {
    switchTheme({ themeId: props.user.themeId });
    setThemeChanged(true);
  }

  return (
    <div className="user-profile">
      <img src={props.user?.profile_pic_url} alt={props.user?.name} />
      <h2>{props.user?.name}</h2>
    </div>
  );
};

const Modal = ({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

const UserProfileMenu = ({
  onSettingsClick,
  user,
}: {
  onSettingsClick: () => void;
  user: User;
}) => {
  const navigate = useNavigate();
  const adminRoute = () => {
    const path = "/admin";
    navigate(path);
  };

  return (
    <div className="profile-menu">
      <a className="menu-item" onClick={onSettingsClick}>
        Settings...
      </a>
      {user?.admin && (
        <a className="menu-item" onClick={adminRoute}>
          Admin
        </a>
      )}
      <a className="menu-item" onClick={onLogoutClick}>
        Log out
      </a>
    </div>
  );
};

const onLogoutClick = () => {
  const path = "/logout";
  window.location.href = path;
};

const UserProfileWidget = (props: { user: User }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <div className="user-profile-widget">
        <div className="profile-container">
          <UserProfile user={props.user} />
          <UserProfileMenu
            onSettingsClick={() => setIsSettingsOpen(true)}
            user={props.user}
          />
        </div>
      </div>
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
        <UserSettingsForm onClose={() => setIsSettingsOpen(false)} />
      </Modal>
    </>
  );
};

export default UserProfileWidget;
