import { Document } from "mongodb";

export interface ValidationOptions {
    validator: Document;
    validationLevel: "strict" | "moderate";
    validationAction: "error" | "warn";
}

export const STRICT_VALIDATION: ValidationOptions = {
    validator: {},
    validationLevel: "strict",
    validationAction: "error"
};