import supabase from '../database/supabase';
import clientService from './clientService';
import taskService from './taskService';
import { Email } from '../types/task';

/**
 * Inbound Email Service
 * Processes inbound emails received via Resend webhook and converts them
 * into Included system emails, then triggers the standard task pipeline.
 */

export interface InboundEmailPayload {
  from: string;
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
   * Process an inbound email payload from Resend.
   *
   * Steps:
   * 1. Extract client ID from the "to" address
   * 2. Validate the client exists
   * 3. Persist an email record (status=pending, source=inbound)
   * 4. Trigger the task → summary → notification pipeline (non-blocking)
   * 5. Return the created email record
   */
  async processInboundEmail(payload: InboundEmailPayload): Promise<Email> {
    console.log(`Processing inbound email from ${payload.from} to ${payload.to}`);

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

    // 3. Create email record
    const { data: email, error } = await supabase()
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
      throw new Error(`Failed to create email record: ${error.message}`);
    }

    console.log(`Inbound email record created: ${email.id}`);

    // 4. Trigger task → summary → notification pipeline (non-blocking)
    const taskInput = `Email from: ${payload.from}\nSubject: ${payload.subject}\n\n${payload.text}`;
    taskService.createTask(taskInput, clientId).catch((err) => {
      console.error(`Failed to trigger pipeline for inbound email ${email.id}:`, err);
    });

    // 5. Return email record
    return email;
  }
}

export const processInboundEmail = async (payload: InboundEmailPayload): Promise<Email> => {
  return new InboundEmailService().processInboundEmail(payload);
};

export default new InboundEmailService();
