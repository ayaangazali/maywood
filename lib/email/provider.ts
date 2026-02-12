export interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export interface EmailProvider {
  send(params: EmailParams): Promise<void>;
}
