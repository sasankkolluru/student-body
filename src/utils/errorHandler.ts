export class AppError extends Error {
  code: string;
  details?: any;
  userMessage: string;

  constructor(message: string, code: string, userMessage?: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage || message;
    this.details = details;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export class WalletError extends AppError {
  constructor(message: string, code: string, userMessage?: string, details?: any) {
    super(message, code, userMessage, details);
    this.name = 'WalletError';
  }
}

export class TransactionError extends AppError {
  constructor(message: string, code: string, userMessage?: string, details?: any) {
    super(message, code, userMessage, details);
    this.name = 'TransactionError';
  }
}

export class ApiError extends AppError {
  statusCode: number;

  constructor(
    message: string, 
    statusCode: number = 500, 
    code: string = 'API_ERROR',
    userMessage?: string,
    details?: any
  ) {
    super(message, code, userMessage, details);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export const ERROR_CODES = {
  // Wallet Errors
  NO_METAMASK: 'NO_METAMASK',
  WRONG_NETWORK: 'WRONG_NETWORK',
  ACCOUNT_ACCESS_REJECTED: 'ACCOUNT_ACCESS_REJECTED',
  
  // Transaction Errors
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  GAS_ESTIMATION_FAILED: 'GAS_ESTIMATION_FAILED',
  
  // API Errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Contract Errors
  CONTRACT_NOT_DEPLOYED: 'CONTRACT_NOT_DEPLOYED',
  INVALID_CONTRACT_ADDRESS: 'INVALID_CONTRACT_ADDRESS',
  CONTRACT_CALL_FAILED: 'CONTRACT_CALL_FAILED',
};

export const ERROR_MESSAGES = {
  [ERROR_CODES.NO_METAMASK]: {
    title: 'MetaMask Not Found',
    message: 'Please install the MetaMask extension to use this feature.',
    action: 'Install MetaMask',
    actionLink: 'https://metamask.io/download.html',
  },
  [ERROR_CODES.WRONG_NETWORK]: {
    title: 'Wrong Network',
    message: 'Please switch to the correct network to continue.',
    action: 'Switch Network',
  },
  [ERROR_CODES.INSUFFICIENT_FUNDS]: {
    title: 'Insufficient Funds',
    message: 'You do not have enough ETH to complete this transaction.',
    action: 'Get ETH',
  },
  [ERROR_CODES.TRANSACTION_REJECTED]: {
    title: 'Transaction Rejected',
    message: 'You rejected the transaction.',
    action: 'Try Again',
  },
  [ERROR_CODES.UNAUTHORIZED]: {
    title: 'Unauthorized',
    message: 'Please log in to continue.',
    action: 'Log In',
  },
};

export function handleError(error: any, context: string = '') {
  console.error(`[${context}]`, error);
  
  // If it's already an AppError, just re-throw
  if (error instanceof AppError) {
    return error;
  }
  
  // Handle MetaMask errors
  if (error.code === 4001) {
    return new WalletError(
      'User rejected the request.',
      ERROR_CODES.TRANSACTION_REJECTED,
      'You rejected the transaction.'
    );
  }
  
  // Handle network errors
  if (error.code === 'NETWORK_ERROR' || !window.navigator.onLine) {
    return new ApiError(
      'Network error occurred',
      0,
      ERROR_CODES.NETWORK_ERROR,
      'Unable to connect to the network. Please check your internet connection.'
    );
  }
  
  // Handle contract errors
  if (error.code === 'CALL_EXCEPTION') {
    return new TransactionError(
      'Contract call failed',
      ERROR_CODES.CONTRACT_CALL_FAILED,
      'Failed to interact with the smart contract.',
      { originalError: error }
    );
  }
  
  // Handle insufficient funds
  if (error.code === 'INSUFFICIENT_FUNDS' || 
      (error.message && error.message.includes('insufficient funds'))) {
    return new TransactionError(
      'Insufficient funds',
      ERROR_CODES.INSUFFICIENT_FUNDS,
      'You do not have enough ETH to complete this transaction.'
    );
  }
  
  // Default error
  return new AppError(
    error.message || 'An unknown error occurred',
    'UNKNOWN_ERROR',
    'Something went wrong. Please try again.'
  );
}

export function getErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode]?.message || 'An unknown error occurred';
}

export function getErrorAction(errorCode: string): { text: string; action?: () => void } | null {
  const error = ERROR_MESSAGES[errorCode];
  if (!error) return null;
  
  return {
    text: error.action,
    action: error.actionLink ? () => window.open(error.actionLink, '_blank') : undefined
  };
}
