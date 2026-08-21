import { SQL, and, or, eq, ilike, asc, desc } from "drizzle-orm";
import { PgColumn } from "drizzle-orm/pg-core";

export type ColumnMap = Record<string, PgColumn>;

export interface BuildQueryOptions {
    columns: ColumnMap;              // searchable/orderable fields -> column
    allowedRelations?: string[];     // relations allowed via ?include=
    baseWhere?: SQL;                 // always-applied condition (e.g. isNull(deleted_at))
    defaultOrderBy?: SQL[];          // fallback if no ?order= given
    defaultLimit?: number;           // default 10
    maxLimit?: number;               // default 100
}

export interface BuiltQuery {
    where: SQL | undefined;
    orderBy: SQL[] | undefined;
    limit: number;
    offset: number;
    with: Record<string, true> | undefined;
    page: number;
}

export function buildQueryOptions(
    query: Record<string, unknown>,
    options: BuildQueryOptions
): BuiltQuery {
    const {
        columns,
        allowedRelations = [],
        baseWhere,
        defaultOrderBy,
        defaultLimit = 10,
        maxLimit = 100,
    } = options;

    // ---- pagination ----
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || defaultLimit));
    const offset = (page - 1) * limit;

    // ---- search: "field:value,field2:value2|field3:value3" (',' = AND, '|' = OR) ----
    const searchRaw = typeof query.search === "string" ? query.search : undefined;
    const searchCondition = parseSearch(searchRaw, columns);

    const where = baseWhere && searchCondition
        ? and(baseWhere, searchCondition)
        : baseWhere ?? searchCondition;

    // ---- order: "field:asc,field2:desc" ----
    const orderRaw = typeof query.order === "string" ? query.order : undefined;
    const orderBy = parseOrder(orderRaw, columns) ?? defaultOrderBy;

    // ---- include: "relation1,relation2" ----
    const includeRaw = typeof query.includes === "string" ? query.includes : undefined;
    const withRelations = parseIncludes(includeRaw, allowedRelations);

    return { where, orderBy, limit, offset, with: withRelations, page };
}

// ----------------- internals -----------------

function parseSearch(search: string | undefined, columns: ColumnMap): SQL | undefined {
    if (!search) return undefined;

    const orGroups = search.split("|").map((g) => g.trim()).filter(Boolean);

    const orConditions = orGroups
        .map((group) => {
            const andParts = group.split(",").map((p) => p.trim()).filter(Boolean);

            const andConditions = andParts
                .map((part) => {
                    const sepIndex = part.indexOf(":");
                    if (sepIndex === -1) return undefined;

                    const field = part.slice(0, sepIndex).trim();
                    const value = part.slice(sepIndex + 1).trim();

                    const column = columns[field];
                    if (!column || value === "") return undefined;

                    if (column.dataType === "number" || column.dataType === "bigint") {
                        const num = Number(value);
                        return isNaN(num) ? undefined : eq(column, num);
                    }
                    if (column.dataType === "boolean") {
                        return eq(column, value.toLowerCase() === "true");
                    }
                    return ilike(column, `%${value}%`);
                })
                .filter((c): c is SQL => Boolean(c));

            if (andConditions.length === 0) return undefined;
            return andConditions.length === 1 ? andConditions[0] : and(...andConditions);
        })
        .filter((c): c is SQL => Boolean(c));

    if (orConditions.length === 0) return undefined;
    return orConditions.length === 1 ? orConditions[0] : or(...orConditions);
}

function parseOrder(order: string | undefined, columns: ColumnMap): SQL[] | undefined {
    if (!order) return undefined;

    const orderBy = order
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .map((part) => {
            const [field, dir] = part.split(":").map((s) => s?.trim());
            const column = columns[field];
            if (!column) return undefined;
            return dir?.toLowerCase() === "desc" ? desc(column) : asc(column);
        })
        .filter((c): c is SQL => Boolean(c));

    return orderBy.length ? orderBy : undefined;
}

function parseIncludes(
    include: string | undefined,
    allowedRelations: string[]
): Record<string, true> | undefined {
    if (!include) return undefined;

    const withObj: Record<string, true> = {};
    for (const rel of include.split(",").map((s) => s.trim()).filter(Boolean)) {
        if (allowedRelations.includes(rel)) withObj[rel] = true;
    }
    return Object.keys(withObj).length ? withObj : undefined;
}