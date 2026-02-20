import supabase from '../database/supabase';
import clientService from './clientService';
import taskService from './taskService';
import { Email } from '../types/task';

export interface InboundEmailPayload {
  from: string;
  /**
   * The single recipient address in the format `client_<uuid>@<domain>`.
   * The route layer is responsible for extracting a single address from
   * multi-recipient payloads before calling the service.
   */
  to: string;
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
   * Process a single inbound email payload from Resend.
   * Throws on validation errors (unknown address, missing client, DB failure).
   *
   * @param payload - Inbound email fields extracted from the Resend webhook
   * @returns The persisted Email record
   */
  async processInboundEmail(payload: InboundEmailPayload): Promise<Email> {
    console.log('Processing inbound email payload:', payload);

    // 1. Extract client ID
    const clientId = this.extractClientId(payload.to);
    if (!clientId) {
      throw new Error(`Could not extract client ID from address: ${payload.to}`);
    }

    // 2. Validate client exists
    const client = await clientService.getClientById(clientId);
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
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
      throw new Error(`Failed to create email for client ${clientId}: ${error.message}`);
    }

    console.log(`Inbound email record created: ${email.id}`);

    // 4. Trigger task pipeline (non-blocking)
    const taskInput = `Email from: ${payload.from}\nSubject: ${payload.subject}\n\n${payload.text}`;
    taskService.createTask(taskInput, clientId).catch((err) => {
      console.error(`Failed to trigger pipeline for inbound email ${email.id}:`, err);
    });

    return email;
  }
}

// helper export
export const processInboundEmail = async (payload: InboundEmailPayload): Promise<Email> => {
  return new InboundEmailService().processInboundEmail(payload);
};

export default new InboundEmailService();