import { v4 as uuidv4 } from 'uuid';
import supabase from '../database/supabase';
import { Client } from '../types/task';

/**
 * Client Service
 * Handles all client-related business logic
 */
export class ClientService {
  /**
   * Create a new client
   */
  async createClient(name: string, email?: string, company?: string, phone?: string, workflowSettings?: object): Promise<Client> {
    const clientId = uuidv4();
    const inboundEmailDomain = process.env.INBOUND_EMAIL_DOMAIN || 'included.yourdomain.com';
    const inboundEmail = `client_${clientId}@${inboundEmailDomain}`;

    const { data: client, error } = await supabase
      .from('clients')
      .insert([
        {
          id: clientId,
          name: name.trim(),
          email: email?.trim() || null,
          company: company?.trim() || null,
          phone: phone?.trim() || null,
          workflow_settings: workflowSettings || null,
          inbound_email: inboundEmail,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create client: ${error.message}`);
    }

    return client;
  }

  /**
   * Get all clients
   */
  async getAllClients(): Promise<Client[]> {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch clients: ${error.message}`);
    }

    return clients || [];
  }

  /**
   * Get a single client by ID
   */
  async getClientById(id: string): Promise<Client | null> {
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch client: ${error.message}`);
    }

    return client;
  }
}

export default new ClientService();