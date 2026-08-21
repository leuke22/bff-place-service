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