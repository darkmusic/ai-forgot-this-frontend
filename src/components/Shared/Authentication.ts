import {User, UserAuthResponse} from "../../constants/data/data.ts";
import {useEffect, useState} from "react";
import {hash} from "bcryptjs";
import { getJson } from "../../lib/api";

export const useCurrentUser = (): User | null => {
    const [user, setUser] = useState<User | null>(null);
    const [, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await getJson<UserAuthResponse>('/api/current-user');
                if (!data.authenticated) {
                    setUser(null);
                    return;
                }
                const userData = await getJson<User>(`/api/user/username/${data.username}`);
                setUser(userData);
            } catch (error) {
                setUser(null);
                console.error('Error fetching user:', error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return user;
};

export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await hash(password, saltRounds);
}
