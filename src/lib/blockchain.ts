// Using Web Crypto API for browser compatibility
const crypto = window.crypto || (window as any).msCrypto; // For IE11

// Helper function to hash a string using Web Crypto API
async function sha256(message: string): Promise<string> {
  // Encode the message as UTF-8
  const msgBuffer = new TextEncoder().encode(message);
  
  // Hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  
  // Convert buffer to byte array
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Convert bytes to hex string
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface Block {
  index: number;
  timestamp: number;
  data: any;
  previousHash: string;
  hash: string;
  nonce: number;
}

class Blockchain {
  chain: Block[];
  difficulty: number;
  pendingVotes: any[];

  constructor() {
    this.chain = [];
    this.difficulty = 2; // Reduced difficulty for browser performance
    this.pendingVotes = [];
    this.initializeBlockchain();
  }

  async initializeBlockchain() {
    const genesisBlock = await this.createGenesisBlock();
    this.chain = [genesisBlock];
  }

  async createGenesisBlock(): Promise<Block> {
    const hash = await this.calculateHash(0, '0', 'Genesis Block', 0);
    return {
      index: 0,
      timestamp: Date.now(),
      data: 'Genesis Block',
      previousHash: '0',
      hash: hash,
      nonce: 0
    };
  }

  async calculateHash(index: number, previousHash: string, data: any, nonce: number): Promise<string> {
    const str = index + previousHash + JSON.stringify(data) + nonce;
    return await sha256(str);
  }

  async minePendingVotes(pollId: string) {
    try {
      // Group votes by poll ID
      const pollVotes = this.pendingVotes.filter((vote: any) => vote.pollId === pollId);
      if (pollVotes.length === 0) return null;

      // Create a block with all votes for this poll
      const previousBlock = this.getLatestBlock();
      const newBlock = await this.createBlock({
        index: previousBlock.index + 1,
        timestamp: Date.now(),
        data: {
          pollId,
          votes: pollVotes,
          totalVotes: pollVotes.length
        },
        previousHash: previousBlock.hash
      });

      // Remove the processed votes from pending
      this.pendingVotes = this.pendingVotes.filter((vote: any) => vote.pollId !== pollId);
      
      return newBlock;
    } catch (error) {
      console.error('Error mining votes:', error);
      throw error;
    }
  }

  async createBlock(blockData: Omit<Block, 'hash' | 'nonce'>): Promise<Block> {
    try {
      const { index, previousHash, data, timestamp } = blockData;
      let nonce = 0;
      let hash = await this.calculateHash(index, previousHash, data, nonce);

      // Proof of work - find a hash that starts with '00' (reduced difficulty for browser)
      while (hash.substring(0, this.difficulty) !== '0'.repeat(this.difficulty)) {
        nonce++;
        hash = await this.calculateHash(index, previousHash, data, nonce);
      }

      const newBlock: Block = {
        ...blockData,
        hash,
        nonce
      };

      this.chain.push(newBlock);
      return newBlock;
    } catch (error) {
      console.error('Error creating block:', error);
      throw error;
    }
  }

  async addVote(vote: any) {
    try {
      this.pendingVotes.push(vote);
      return this.getLatestBlock().index + 1; // Return the block index this vote will be in
    } catch (error) {
      console.error('Error adding vote:', error);
      throw error;
    }
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  async isChainValid(): Promise<boolean> {
    try {
      for (let i = 1; i < this.chain.length; i++) {
        const currentBlock = this.chain[i];
        const previousBlock = this.chain[i - 1];

        // Check if current block hash is valid
        const currentHash = await this.calculateHash(
          currentBlock.index,
          currentBlock.previousHash,
          currentBlock.data,
          currentBlock.nonce
        );

        if (currentBlock.hash !== currentHash) {
          return false;
        }

        // Check if previous hash is correct
        if (currentBlock.previousHash !== previousBlock.hash) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error validating chain:', error);
      return false;
    }
  }

  getPollResults(pollId: string): any {
    const results: any = {
      pollId,
      totalVotes: 0,
      options: {},
      voters: new Set<string>()
    };

    for (const block of this.chain) {
      if (block.data.pollId === pollId && block.data.votes) {
        for (const vote of block.data.votes) {
          results.totalVotes++;
          results.voters.add(vote.voterId);
          results.options[vote.optionId] = (results.options[vote.optionId] || 0) + 1;
        }
      }
    }

    results.uniqueVoters = results.voters.size;
    delete results.voters;
    return results;
  }
}

// Singleton instance
export const blockchain = new Blockchain();

export { generateVoterId };

// Helper function to generate a unique voter ID using Web Crypto API
async function generateVoterId(): Promise<string> {
  try {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return 'voter-' + Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Error generating voter ID:', error);
    // Fallback to simpler random string if Web Crypto fails
    return 'voter-' + Math.random().toString(36).substr(2, 9) + Date.now();
  }
}
