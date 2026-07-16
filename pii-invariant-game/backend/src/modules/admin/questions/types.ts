export interface PiiQuestionResponse {
    externalId: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    shipping: string | null;
    correctNotes: boolean;
    correctShipping: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePiiQuestionRequest {
    externalId: string;
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    shipping?: string;
    correctNotes: boolean;
    correctShipping: boolean;
    isActive?: boolean;
}

export interface UpdatePiiQuestionRequest {
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
    shipping?: string | null;
    correctNotes?: boolean;
    correctShipping?: boolean;
    isActive?: boolean;
}

export interface InvariantQuestionResponse {
    externalId: string;
    items: string;
    tax: string;
    shipping: string;
    totalPrice: string;
    isViolation: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateInvariantQuestionRequest {
    externalId: string;
    items: number;
    tax: number;
    shipping: number;
    totalPrice: number;
    isViolation: boolean;
    isActive?: boolean;
}

export interface UpdateInvariantQuestionRequest {
    items?: number;
    tax?: number;
    shipping?: number;
    totalPrice?: number;
    isViolation?: boolean;
    isActive?: boolean;
}
