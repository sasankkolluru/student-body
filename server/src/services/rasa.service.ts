import axios from 'axios';

export class RasaService {
  private rasaUrl: string;
  private isAvailable: boolean = false;

  constructor(rasaUrl: string = 'http://localhost:5005') {
    this.rasaUrl = rasaUrl;
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    try {
      const response = await axios.get(`${this.rasaUrl}/health`, { timeout: 5000 });
      this.isAvailable = response.data.status === 'healthy';
      console.log(`Rasa service ${this.isAvailable ? 'available' : 'unavailable'}`);
    } catch (error) {
      this.isAvailable = false;
      console.log('Rasa service unavailable, falling back to Node-NLP');
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
