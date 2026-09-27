import {
  getTableName,
  or,
  sql,
  type AnyColumn,
  type SQL,
  type SQLWrapper,
} from "drizzle-orm";

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageCount: number;
};

/** Splits a free-text query into at most five terms; every term must match. */
export function searchTerms(q: string | undefined): string[] {
  if (!q) return [];
  return q.trim().split(/\s+/).filter(Boolean).slice(0, 5);
}

function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Case-insensitive "contains" match of `term` against any of `columns`. */
export function likeAny(columns: SQLWrapper[], term: string): SQL {
  const pattern = `%${escapeLike(term)}%`;
  return or(
    ...columns.map((column) => sql`${column} LIKE ${pattern} ESCAPE '\\'`),
  )!;
}

/**
 * A fully qualified column reference ("table"."column") for correlated subqueries.
 * Drizzle omits the table name in single-table selects, which would make an outer
 * reference like `categories.id` resolve to the subquery's own `id` column.
 */
export function outer(column: AnyColumn): SQL {
  return sql.raw(`"${getTableName(column.table)}"."${column.name}"`);
}
