import {User, USERS} from "../../constants/data/data.ts";

export function useAuth() : User {
    return USERS[0];
}
