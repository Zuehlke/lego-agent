export default class RobotClient {
  private baseUrl: string;
  private motorSpeeds: { left_speed: number; right_speed: number };
  private motorWatchdogInterval: NodeJS.Timeout | null = null;

  constructor(ip: string) {
    this.baseUrl = `http://${ip}:5000`
    this.motorSpeeds = {left_speed: 0, right_speed: 0};
    this.startMotorWatchdog();
  }

  private async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Unknown error');
    }
    return response.json();
  }

  async getDevices(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/list_devices`);
    return this.handleResponse(response);
  }

  async setLights(leftColor: string, rightColor: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/set_lights`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({left_color: leftColor, right_color: rightColor})
    });
    await this.handleResponse(response);
  }

  async setMotors(leftSpeed: number, rightSpeed: number): Promise<void> {
    this.motorSpeeds = {left_speed: leftSpeed, right_speed: rightSpeed};
    const response = await fetch(`${this.baseUrl}/set_motors`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(this.motorSpeeds)
    });
    await this.handleResponse(response);
  }

  async setHead(position: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/set_head`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({position})
    });
    await this.handleResponse(response);
  }

  async speak(text: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/speak`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({text})
    });
    await this.handleResponse(response);
  }

  async getDistance(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/get_distance`);
    const json = await this.handleResponse(response);
    return json.distance;
  }

  private startMotorWatchdog(): void {
    this.motorWatchdogInterval = setInterval(() => {
      if (this.motorSpeeds.left_speed !== 0 || this.motorSpeeds.right_speed !== 0) {
        this.setMotors(this.motorSpeeds.left_speed, this.motorSpeeds.right_speed);
      }
    }, 2000);
  }

  public destroy(): void {
    if (this.motorWatchdogInterval) {
      clearInterval(this.motorWatchdogInterval);
      this.motorWatchdogInterval = null;
    }
  }
}
