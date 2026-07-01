export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (error && typeof error === 'object') {
    const maybeAxiosError = error as {
      response?: {
        data?: {
          message?: string | string[];
        };
      };
      message?: string;
    };

    const apiMessage = maybeAxiosError.response?.data?.message;
    if (Array.isArray(apiMessage)) {
      const joined = apiMessage.filter(Boolean).join(', ');
      if (joined) return joined;
    }

    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }

    if (typeof maybeAxiosError.message === 'string' && maybeAxiosError.message.trim()) {
      return maybeAxiosError.message;
    }
  }

  return fallback;
}
