// Default configuration for development
const DEFAULT_CONFIG = {
  // Default to Rinkeby testnet
  DEFAULT_CHAIN_ID: 4,
  
  // Contract addresses (update these with your deployed contract addresses)
  CONTRACT_ADDRESSES: {
    4: {
      // Rinkeby
      VOTING: process.env.REACT_APP_VOTING_CONTRACT_ADDRESS || '',
      TOKEN: process.env.REACT_APP_TOKEN_CONTRACT_ADDRESS || '',
    },
    137: {
      // Polygon Mainnet
      VOTING: '',
      TOKEN: '',
    },
    80001: {
      // Mumbai Testnet
      VOTING: '',
      TOKEN: '',
    },
  },
  
  // RPC URLs
  RPC_URLS: {
    1: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_ID}`,
    4: `https://rinkeby.infura.io/v3/${process.env.REACT_APP_INFURA_ID}`,
    137: 'https://polygon-rpc.com',
    80001: 'https://rpc-mumbai.maticvigil.com',
  },
  
  // Block explorers
  BLOCK_EXPLORER_URLS: {
    1: 'https://etherscan.io',
    4: 'https://rinkeby.etherscan.io',
    137: 'https://polygonscan.com',
    80001: 'https://mumbai.polygonscan.com',
  },
  
  // Network names
  NETWORK_NAMES: {
    1: 'Ethereum Mainnet',
    4: 'Rinkeby Testnet',
    137: 'Polygon Mainnet',
    80001: 'Mumbai Testnet',
  },
  
  // Default gas settings
  GAS: {
    // Default gas limit for transactions
    DEFAULT_GAS_LIMIT: 300000,
    // Multiplier for gas price (1.1 = 10% increase)
    GAS_PRICE_MULTIPLIER: 1.1,
    // Max gas price in Gwei
    MAX_GAS_PRICE: 100,
  },
  
  // API endpoints
  API: {
    BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
    TIMEOUT: 30000, // 30 seconds
  },
};

// Get configuration based on environment
export const getConfig = () => {
  // In production, you might want to use different settings
  if (process.env.NODE_ENV === 'production') {
    return {
      ...DEFAULT_CONFIG,
      // Override any production-specific settings here
      DEFAULT_CHAIN_ID: 1, // Default to mainnet in production
    };
  }
  
  // In test environment
  if (process.env.NODE_ENV === 'test') {
    return {
      ...DEFAULT_CONFIG,
      // Override any test-specific settings here
    };
  }
  
  // Default to development
  return DEFAULT_CONFIG;
};

// Export the current config
export const config = getConfig();

// Helper functions
export const getContractAddress = (chainId: number, contractType: 'VOTING' | 'TOKEN'): string => {
  return config.CONTRACT_ADDRESSES[chainId as keyof typeof config.CONTRACT_ADDRESSES]?.[contractType] || '';
};

export const getRpcUrl = (chainId: number): string => {
  return config.RPC_URLS[chainId as keyof typeof config.RPC_URLS] || '';
};

export const getBlockExplorerUrl = (chainId: number): string => {
  return config.BLOCK_EXPLORER_URLS[chainId as keyof typeof config.BLOCK_EXPLORER_URLS] || '';
};

export const getNetworkName = (chainId: number): string => {
  return config.NETWORK_NAMES[chainId as keyof typeof config.NETWORK_NAMES] || `Unknown Network (${chainId})`;
};

export const isSupportedNetwork = (chainId: number): boolean => {
  return chainId in config.CONTRACT_ADDRESSES;
};

export default config;
