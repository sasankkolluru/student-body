import { MetaMaskInpageProvider } from '@metamask/providers';

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider;
  }
}

// Add type declarations for process.env
namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    REACT_APP_VOTING_CONTRACT_ADDRESS?: string;
    REACT_APP_TOKEN_CONTRACT_ADDRESS?: string;
    REACT_APP_DEFAULT_CHAIN_ID?: string;
    REACT_APP_INFURA_ID?: string;
  }
}

// Declare modules for CSS and other assets
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

// Add type for the Web3 provider
interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    isStatus?: boolean;
    host?: string;
    pathname?: string;
    sendAsync?: (request: { method: string, params?: Array<any> }, callback: (error: any, response: any) => void) => void;
    send?: (request: { method: string, params?: Array<any> }, callback: (error: any, response: any) => void) => void;
    request: (request: { method: string, params?: Array<any> }) => Promise<any>;
    on?: (event: string, callback: (params: any) => void) => void;
    removeListener?: (event: string, callback: (params: any) => void) => void;
    chainId?: string;
    networkVersion?: string;
    selectedAddress?: string;
  };
}

// Add type for the voting module
declare module 'voting' {
  export interface VotingResult {
    pollId: string;
    optionId: string;
    voter: string;
    timestamp: number;
  }
}

// Add type for process (Node.js)
declare const process: {
  env: {
    NODE_ENV: 'development' | 'production' | 'test';
    REACT_APP_VOTING_CONTRACT_ADDRESS?: string;
    REACT_APP_TOKEN_CONTRACT_ADDRESS?: string;
    REACT_APP_DEFAULT_CHAIN_ID?: string;
    [key: string]: string | undefined;
  };
};
