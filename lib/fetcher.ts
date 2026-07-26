export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error || data?.message || "خطایی در ارتباط با سرور رخ داد";

    throw new Error(message);
  }

  return data as T;
}
