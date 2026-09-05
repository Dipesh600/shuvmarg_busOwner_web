export function collectFleetSetupResults<T>(
  results: PromiseSettledResult<T>[],
): T[] {
  const unauthorized = results.some(
    (result) =>
      result.status === "rejected" &&
      result.reason instanceof Error &&
      result.reason.message === "UNAUTHORIZED",
  );
  if (unauthorized) throw new Error("UNAUTHORIZED");
  return results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
}
