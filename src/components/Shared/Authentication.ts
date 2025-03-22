import {User, UserAuthResponse} from "../../constants/data/data.ts";
import {useEffect, useState} from "react";

// Create a proper React custom hook
export const useCurrentUser = (): User | null => {
    const [user, setUser] = useState<User | null>(null);
    const [, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/current-user')
            .then(response => response.json())
            .then((data: UserAuthResponse) => {
                return fetch(`/api/user/username/${data.username}`);
            })
            .then(response => response.json())
            .then(userData => setUser(userData))
            .catch(error => console.error('Error fetching user:', error))
            .finally(() => setLoading(false));
    }, []);

    return user;
};

// Export a synchronous function for non-hook contexts
export const getAuthHeader = (user: User) => {
    return "Basic " + btoa(user.username + ":" + user.password_hash);
};
