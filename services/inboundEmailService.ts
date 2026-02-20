import supabase from '../database/supabase';
import clientService from './clientService';
import taskService from './taskService';
import { Email } from '../types/task';

export interface InboundEmailPayload {
  from: string;
  to: string | string[]; // can be array now
  subject: string;
  text: string;
  html?: string;
}

export class InboundEmailService {
  /**
   * Extract client UUID from a to-address of the form
   * client_<uuid>@<domain>
   */
  private extractClientId(to: string): string | null {
    const match = to.match(
      /^client_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})@/i
    );
    return match ? match[1] : null;
  }

  /**
   * Process an inbound email payload from Resend.
   */
  async processInboundEmail(payload: InboundEmailPayload): Promise<Email[]> {
    console.log('Processing inbound email payload:', payload);

    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const emails: Email[] = [];

    for (const to of recipients) {
      // 1. Extract client ID
      const clientId = this.extractClientId(to);
      if (!clientId) {
        console.warn(`Could not extract client ID from address: ${to}`);
        continue;
      }

      // 2. Validate client exists
      const client = await clientService.getClientById(clientId);
      if (!client) {
        console.warn(`Client not found: ${clientId}`);
        continue;
      }

      // 3. Insert email into Supabase
      const { data: email, error } = await supabase
        .from('emails')
        .insert([
          {
            client_id: clientId,
            sender: payload.from,
            subject: payload.subject,
            body: payload.text,
            status: 'pending',
            source: 'inbound',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error(`Failed to create email for client ${clientId}:`, error.message);
        continue;
      }

      console.log(`Inbound email record created: ${email.id}`);
      emails.push(email);

      // 4. Trigger task pipeline (non-blocking)
      const taskInput = `Email from: ${payload.from}\nSubject: ${payload.subject}\n\n${payload.text}`;
      taskService.createTask(taskInput, clientId).catch((err) => {
        console.error(`Failed to trigger pipeline for inbound email ${email.id}:`, err);
      });
    }

    return emails;
  }
}

// helper export
export const processInboundEmail = async (payload: InboundEmailPayload): Promise<Email[]> => {
  return new InboundEmailService().processInboundEmail(payload);
};

export default new InboundEmailService();