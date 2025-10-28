import axios from 'axios';

export class RasaService {
  private rasaUrl: string;
  private isAvailable: boolean = false;
  private maxRetries = 3;
  private retryDelay = 2000; // 2 seconds

  constructor(rasaUrl: string = 'http://localhost:5005') {
    this.rasaUrl = rasaUrl;
    this.checkAvailability();
  }

  private async checkAvailability(retryCount: number = 0): Promise<void> {
    try {
      const response = await axios.get(`${this.rasaUrl}/health`, { 
        timeout: 5000 
      });
      this.isAvailable = response.data.status === 'healthy';
      console.log(`Rasa service ${this.isAvailable ? 'available' : 'unavailable'}`);
    } catch (error) {
      this.isAvailable = false;
      if (retryCount < this.maxRetries) {
        console.log(`Rasa service unavailable, retrying in ${this.retryDelay/1000} seconds... (${retryCount + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.checkAvailability(retryCount + 1);
      }
      console.log('Rasa service unavailable after retries, falling back to Node-NLP');
    }
  }

  public async processMessage(message: string, userId: string = 'default'): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('Rasa service not available');
    }

    try {
      const response = await axios.post(`${this.rasaUrl}/webhook`, {
        message,
        user_id: userId
      }, { timeout: 10000 });

      return response.data.response;
    } catch (error) {
      console.error('Error calling Rasa service:', error);
      throw new Error('Failed to process message with Rasa');
    }
  }

  public isRasaAvailable(): boolean {
    return this.isAvailable;
  }

  public async reconnect(): Promise<void> {
    await this.checkAvailability();
  }
}
