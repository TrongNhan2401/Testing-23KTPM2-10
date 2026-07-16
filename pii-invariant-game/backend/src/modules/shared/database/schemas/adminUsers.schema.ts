import { Document, IndexDescription } from "mongodb";

export const ADMIN_USERS_COLLECTION = "adminUsers" as const;

export type AdminRole = "ADMIN";

export interface AdminUserDoc extends Document {
    _id: Document["_id"];
    username: string;
    passwordHash: string;
    role: AdminRole;
    createdAt: Date;
    updatedAt: Date;
}

export const adminUsersValidator = {
    $jsonSchema: {
        bsonType: "object",
        required: [
            "username",
            "passwordHash",
            "role",
            "createdAt",
            "updatedAt"
        ],
        properties: {
            _id: { bsonType: "objectId" },
            username: {
                bsonType: "string",
                pattern: "^[a-z][a-z0-9_]{2,30}$",
                minLength: 3,
                maxLength: 31
            },
            passwordHash: {
                bsonType: "string",
                pattern: "^\\$2[aby]\\$"
            },
            role: { enum: ["ADMIN"] },
            createdAt: { bsonType: "date" },
            updatedAt: { bsonType: "date" }
        },
        additionalProperties: false
    }
};

export const adminUsersIndexes: IndexDescription[] = [
    { key: { username: 1 }, name: "username_unique", unique: true }
];