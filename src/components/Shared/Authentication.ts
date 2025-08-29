import {User, UserAuthResponse} from "../../constants/data/data.ts";
import {useEffect, useState} from "react";
import {hash} from "bcryptjs";
import {TOMCAT_SERVER_URL} from "../../constants/router/router.tsx";

export const useCurrentUser = (): User | null => {
    const [user, setUser] = useState<User | null>(null);
    const [, setLoading] = useState(true);

    useEffect(() => {
        fetch(TOMCAT_SERVER_URL + '/api/current-user', { credentials: 'include' })
            .then(response => response.json())
            .then((data: UserAuthResponse) => {
                if (!data.authenticated) {
                    setUser(null);
                    return;
                }
                return fetch(TOMCAT_SERVER_URL + `/api/user/username/${data.username}`, { credentials: 'include' });
            })
            .then(response => response?.json())
            .then(userData => userData && setUser(userData))
            .catch(error => { setUser(null); console.error('Error fetching user:', error) })
            .finally(() => setLoading(false));
    }, []);

    return user;
};

export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await hash(password, saltRounds);
}
