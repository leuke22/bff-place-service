import type { Response } from "express";

interface ListResponse<T> {
    success: boolean;
    response: {
        count: number;
        rows: T[];
    };
}

export function ListResponse<T>(
    res: Response,
    rows: T[],
    count: number,
    statusCode = 200
) {
    const response: ListResponse<T> = {
        success: true,
        response: {
            count,
            rows,
        },
    };

    return res.status(statusCode).json(response);
}

interface DataResponse<T> {
    success: boolean;
    response: T;
}

export function DataResponse<T>(
    res: Response,
    data: T,
    statusCode = 200
) {
    const response: DataResponse<T> = {
        success: true,
        response: data,
    };

    return res.status(statusCode).json(response);
}

interface ErrorResponsePayload {
    success: boolean;
    error?: number;
    errorMessage?: string;
    errorDescription?: string;
}

export function ErrorResponse(
    res: Response,
    statusCode: number,
    errorMessage: string,
    errorDescription?: string,
    error?: number
) {
    const response: ErrorResponsePayload = {
        success: false,
        error,
        errorMessage,
        errorDescription,
    };

    return res.status(statusCode).json(response);
}