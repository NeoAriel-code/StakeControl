export type TransactionalEmail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  idempotencyKey: string;
};

export type EmailProvider = {
  send(input: TransactionalEmail): Promise<{ id: string }>;
};
