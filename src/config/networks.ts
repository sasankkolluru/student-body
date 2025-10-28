export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  contractAddress: string;
}

export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  // Ethereum Mainnet
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://etherscan.io',
    contractAddress: '0x0000000000000000000000000000000000000000' // Replace with actual contract address
  },
  // Goerli Testnet
  5: {
    chainId: 5,
    name: 'Goerli Testnet',
    rpcUrl: 'https://goerli.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://goerli.etherscan.io',
    contractAddress: '0x0000000000000000000000000000000000000000' // Replace with actual contract address
  },
  // Sepolia Testnet
  11155111: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://sepolia.etherscan.io',
    contractAddress: '0x0000000000000000000000000000000000000000' // Replace with actual contract address
  },
  // Polygon Mainnet
  137: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    contractAddress: '0x0000000000000000000000000000000000000000' // Replace with actual contract address
  },
  // Mumbai Testnet
  80001: {
    chainId: 80001,
    name: 'Mumbai Testnet',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com',
    contractAddress: '0x0000000000000000000000000000000000000000' // Replace with actual contract address
  }
};

export const getNetworkConfig = (chainId: number): NetworkConfig => {
  const network = SUPPORTED_NETWORKS[chainId];
  if (!network) {
    throw new Error(`Network with chainId ${chainId} is not supported`);
  }
  return network;
};

export const isValidNetwork = (chainId: number): boolean => {
  return !!SUPPORTED_NETWORKS[chainId];
};