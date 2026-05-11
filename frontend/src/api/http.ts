import type { ApiErrorBody } from "../types";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown | null;

  constructor(args: { status: number; code: string; message: string; details: unknown | null }) {
    super(args.message);
    this.code = args.code;
    this.status = args.status;
    this.details = args.details;
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }
  });

  const contentType = res.headers.get("content-type") ?? "";
  const hasJson = contentType.includes("application/json");
  const body = hasJson ? ((await res.json()) as unknown) : null;

  if (!res.ok) {
    const maybe = body as Partial<ApiErrorBody> | null;
    const code = maybe?.error?.code ?? "HTTP_ERROR";
    const message = maybe?.error?.message ?? `Request failed (${res.status})`;
    const details = maybe?.error?.details ?? null;
    throw new ApiError({ status: res.status, code, message, details });
  }

  return body as T;
}