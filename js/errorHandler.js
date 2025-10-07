(function () {
  const ErrorCategory = Object.freeze({
    NETWORK: 'NetworkError',
    VALIDATION: 'ValidationError',
    INTERNAL: 'InternalError'
  });

  const MAX_LOGS_PER_CATEGORY = 50;
  const errorLogs = {
    [ErrorCategory.NETWORK]: [],
    [ErrorCategory.VALIDATION]: [],
    [ErrorCategory.INTERNAL]: []
  };

  class AppError extends Error {
    constructor(message, { category = ErrorCategory.INTERNAL, context = 'Genel', cause, details } = {}) {
      super(message);
      this.name = this.constructor.name;
      this.category = category;
      this.context = context;
      if (cause !== undefined) {
        this.cause = cause;
      }
      if (details) {
        this.details = details;
      }
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }

    static from(error, options = {}) {
      if (error instanceof AppError) {
        if (options.context && (!error.context || error.context === 'Genel')) {
          error.context = options.context;
        }
        if (options.category && error.category === ErrorCategory.INTERNAL && options.category !== ErrorCategory.INTERNAL) {
          error.category = options.category;
        }
        if (options.details) {
          error.details = Object.assign({}, error.details || {}, options.details);
        }
        return error;
      }

      const message = error && error.message ? error.message : String(error);
      const category = options.category || inferCategory(error);
      return new AppError(message, {
        category,
        context: options.context || 'Genel',
        cause: options.preserveCause === false ? undefined : error,
        details: options.details
      });
    }
  }

  class NetworkError extends AppError {
    constructor(message, options = {}) {
      super(message, Object.assign({}, options, { category: ErrorCategory.NETWORK }));
    }
  }

  class ValidationError extends AppError {
    constructor(message, options = {}) {
      super(message, Object.assign({}, options, { category: ErrorCategory.VALIDATION }));
    }
  }

  class InternalError extends AppError {
    constructor(message, options = {}) {
      super(message, Object.assign({}, options, { category: ErrorCategory.INTERNAL }));
    }
  }

  function inferCategory(error) {
    if (!error) {
      return ErrorCategory.INTERNAL;
    }

    if (error instanceof AppError && error.category) {
      return error.category;
    }

    if (error instanceof NetworkError || error.name === 'NetworkError') {
      return ErrorCategory.NETWORK;
    }

    if (error instanceof ValidationError || error.name === 'ValidationError') {
      return ErrorCategory.VALIDATION;
    }

    const message = error && error.message ? error.message : String(error);
    if (/network|fetch|timeout|internet|Failed to fetch|offline|ERR_NETWORK/i.test(message)) {
      return ErrorCategory.NETWORK;
    }

    if (/validasyon|validation|geçersiz|zorunlu|required|doldurun/i.test(message)) {
      return ErrorCategory.VALIDATION;
    }

    return ErrorCategory.INTERNAL;
  }

  function displayUserMessage(message, tone = 'error') {
    if (!message) {
      return;
    }

    const container = document.getElementById('durum');
    if (!container) {
      return;
    }

    const safeMessage = String(message);
    const statusTone = tone === 'success' ? 'success' : 'error';
    const displayId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    container.dataset.displayId = displayId;
    container.innerHTML = `<div class="status-message status-${statusTone}">${safeMessage}</div>`;

    setTimeout(() => {
      if (container.dataset.displayId === displayId) {
        container.innerHTML = '';
      }
    }, 6000);
  }

  function recordLog(error) {
    const entry = {
      timestamp: new Date().toISOString(),
      context: error.context || 'Genel',
      category: error.category || ErrorCategory.INTERNAL,
      message: error.message,
      details: error.details || null
    };

    const bucket = errorLogs[entry.category] || (errorLogs[entry.category] = []);
    bucket.push(entry);
    if (bucket.length > MAX_LOGS_PER_CATEGORY) {
      bucket.shift();
    }

    if (console && typeof console.groupCollapsed === 'function') {
      console.groupCollapsed(`%c${entry.category}%c | ${entry.context}`, 'color:#d32f2f;font-weight:bold;', 'color:inherit;font-weight:normal;');
      console.error(error);
      if (entry.details) {
        console.info('Detaylar:', entry.details);
      }
      console.groupEnd();
    } else {
      console.error(`Hata [${entry.context}] (${entry.category}):`, error);
      if (entry.details) {
        console.info('Detaylar:', entry.details);
      }
    }

    return entry;
  }

  function getDefaultUserMessage(error) {
    switch (error.category) {
      case ErrorCategory.VALIDATION:
        return 'Lütfen girdi bilgilerinizi kontrol edin.';
      case ErrorCategory.NETWORK:
        return 'Bağlantı sorunu oluştu. Lütfen internetinizi kontrol edin ve tekrar deneyin.';
      default:
        return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
    }
  }

  function resolveOptions(contextOrOptions, maybeOptions) {
    if (typeof contextOrOptions === 'string') {
      return Object.assign({}, maybeOptions || {}, { context: contextOrOptions });
    }
    return Object.assign({}, contextOrOptions || {});
  }

  function handleAppError(error, contextOrOptions, maybeOptions) {
    const options = resolveOptions(contextOrOptions, maybeOptions);
    const normalized = AppError.from(error, options);
    const logEntry = recordLog(normalized);

    const userMessage = options.userMessage || getDefaultUserMessage(normalized);
    const messageType = options.messageType || 'error';

    if (!options.silent) {
      displayUserMessage(userMessage, messageType);
    }

    if (typeof options.onFallback === 'function') {
      try {
        options.onFallback(normalized, logEntry);
      } catch (fallbackError) {
        console.error('Fallback çalıştırılırken beklenmeyen bir hata oluştu:', fallbackError);
      }
    }

    if (options.rethrow) {
      throw normalized;
    }

    if (Object.prototype.hasOwnProperty.call(options, 'fallbackValue')) {
      return options.fallbackValue;
    }

    return undefined;
  }

  function safeExecute(fn, options = {}) {
    try {
      return fn();
    } catch (error) {
      return handleAppError(error, Object.assign({ category: ErrorCategory.INTERNAL }, options));
    }
  }

  async function safeExecuteAsync(fn, options = {}) {
    try {
      return await fn();
    } catch (error) {
      return handleAppError(error, Object.assign({ category: ErrorCategory.INTERNAL }, options));
    }
  }

  async function safeApiCall(apiFn, options = {}) {
    try {
      return await apiFn();
    } catch (error) {
      return handleAppError(error, Object.assign({ category: ErrorCategory.NETWORK }, options));
    }
  }

  window.addEventListener('error', (event) => {
    handleAppError(event.error || event.message || 'Bilinmeyen hata', {
      context: 'Pencere',
      userMessage: 'Beklenmeyen bir hata oluştu. Sayfayı yenilemeyi deneyebilirsiniz.'
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    handleAppError(event.reason, {
      context: 'Promise',
      userMessage: 'Arka planda beklenmeyen bir hata oluştu. Lütfen işlemi tekrar deneyin.'
    });
  });

  window.AppErrorBoundary = Object.freeze({
    run: safeExecute,
    runAsync: safeExecuteAsync,
    safeExecute,
    safeExecuteAsync,
    safeApiCall,
    getLogs: () => JSON.parse(JSON.stringify(errorLogs)),
    categories: ErrorCategory
  });

  window.AppErrors = Object.freeze({
    AppError,
    NetworkError,
    ValidationError,
    InternalError,
    categories: ErrorCategory
  });

  window.handleAppError = handleAppError;
})();
