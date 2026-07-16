import { Collection, Db, Filter } from "mongodb";
import { ADMIN_USERS_COLLECTION, AdminUserDoc } from "../shared/database/schemas";

export class AuthRepository {
    private readonly adminUsers: Collection<AdminUserDoc>;

    constructor(db: Db) {
        this.adminUsers = db.collection<AdminUserDoc>(ADMIN_USERS_COLLECTION);
    }

    async findByUsername(username: string): Promise<AdminUserDoc | null> {
        return this.adminUsers.findOne({ username } as Filter<AdminUserDoc>);
    }
}
