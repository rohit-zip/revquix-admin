import type { AxiosError } from "axios"

export type ErrorType =
  | "AUTH_ERROR"
  | "DATA_ERROR"
  | "VALIDATION_ERROR"
  | "NOT_FOUND_ERROR"
  | "INTERNAL_ERROR"

export interface ExceptionResponse {
  message: string | Record<string, string> | string[]
  code: string
  localizedMessage?: string | null
  httpStatus: number
  errorType: ErrorType
  timestamp: string
  path?: string | null
  retryAfterSeconds?: number | null
  requestId: string
}

// ─── Typed API Error ───────────────────────────────────────────────────────────
export class ApiError extends Error {
  public readonly code: string
  public readonly httpStatus: number
  public readonly errorType: ErrorType
  public readonly requestId: string
  public readonly retryAfterSeconds?: number | null
  private readonly rawMessage: ExceptionResponse["message"]

  constructor(response: ExceptionResponse) {
    const displayMsg =
      typeof response.message === "string"
        ? response.message
        : Array.isArray(response.message)
          ? response.message.join(". ")
          : "An error occurred"

    super(displayMsg)
    this.name = "ApiError"
    this.rawMessage = response.message
    this.code = response.code
    this.httpStatus = response.httpStatus
    this.errorType = response.errorType ?? "DATA_ERROR"
    this.requestId = response.requestId ?? "unknown"
    this.retryAfterSeconds = response.retryAfterSeconds
  }

  /** true when message is Record<string, string> — should go on form fields */
  get isFieldError(): boolean {
    return (
      typeof this.rawMessage === "object" &&
      !Array.isArray(this.rawMessage) &&
      this.rawMessage !== null
    )
  }

  /** true when message is string[] */
  get isListError(): boolean {
    return Array.isArray(this.rawMessage)
  }

  /** true when message is a plain string */
  get isStringError(): boolean {
    return typeof this.rawMessage === "string"
  }

  /** true for HTTP 5XX responses */
  get is5xx(): boolean {
    return this.httpStatus >= 500
  }

  /** Field-keyed errors — only valid when isFieldError is true */
  get fieldErrors(): Record<string, string> {
    if (this.isFieldError) return this.rawMessage as Record<string, string>
    return {}
  }

  /** All messages as string[] — valid for both string and list errors */
  get messages(): string[] {
    if (this.isListError) return this.rawMessage as string[]
    if (this.isStringError) return [this.rawMessage as string]
    return []
  }
}

// ─── Network / No-Response Error ──────────────────────────────────────────────
export class NetworkError extends Error {
  constructor() {
    super("No network connection. Please check your internet and try again.")
    this.name = "NetworkError"
  }
}

// ─── Parse raw AxiosError → typed error ───────────────────────────────────────
export function parseAxiosError(error: AxiosError): ApiError | NetworkError {
  // No response → connectivity issue
  if (!error.response) {
    return new NetworkError()
  }

  const data = error.response.data as Partial<ExceptionResponse>
  const httpStatus = error.response.status

  // Mask all 5XX errors — never expose internals to the user
  if (httpStatus >= 500) {
    return new ApiError({
      message: "Something went wrong. Please try again later.",
      code: "RQ-IE-00",
      httpStatus,
      errorType: "INTERNAL_ERROR",
      requestId: data.requestId ?? "unknown",
      timestamp: new Date().toISOString(),
    })
  }

  // Parse 4XX directly from the ExceptionResponse body
  return new ApiError({
    message: data.message ?? "An unexpected error occurred.",
    code: data.code ?? "RQ-UE-00",
    httpStatus,
    errorType: data.errorType ?? "DATA_ERROR",
    requestId: data.requestId ?? "unknown",
    timestamp: data.timestamp ?? new Date().toISOString(),
    path: data.path,
    retryAfterSeconds: data.retryAfterSeconds,
    localizedMessage: data.localizedMessage,
  })
}

