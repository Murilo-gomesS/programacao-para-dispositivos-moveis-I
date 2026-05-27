function logServerError(req, contextMessage, error) {
  const requestId = req?.id || 'no-request-id';
  const method = req?.method || 'NO_METHOD';
  const url = req?.originalUrl || req?.url || 'NO_URL';

  console.error(`[${requestId}] ${contextMessage} (${method} ${url})`);

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const safe = {
      name: error?.name,
      message: error?.message,
      code: error?.code,
    };
    console.error(safe);
    return;
  }

  console.error(error);
}

module.exports = { logServerError };
