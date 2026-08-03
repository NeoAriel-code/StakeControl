import * as Sentry from "@sentry/nextjs";

type RowCounter<T> = (result: T) => number;

export function withDatabaseSpan<T>(
  name: string,
  operation: string,
  callback: () => Promise<T>,
  countRows?: RowCounter<T>,
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: "db.query",
      attributes: {
        "db.system": "sqlite",
        "db.operation.name": operation,
      },
    },
    async (span) => {
      try {
        const result = await callback();
        span.setAttribute("stakecontrol.result", "ok");
        if (countRows) {
          span.setAttribute("db.response.returned_rows", countRows(result));
        }
        return result;
      } catch (error) {
        span.setAttribute("stakecontrol.result", "error");
        throw error;
      }
    },
  );
}
