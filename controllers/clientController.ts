import { Request, Response } from 'express';
import clientService from '../services/clientService';

/**
 * Client Controller
 * Handles HTTP requests for client endpoints
 */
export class ClientController {
  /**
   * POST /clients
   * Create a new client
   */
  async createClient(req: Request, res: Response): Promise<Response> {
    try {
      const { name, email, company } = req.body;

      // Validate name
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Request body must contain a non-empty "name" field',
        });
      }

      const client = await clientService.createClient(name, email, company);

      console.log(`Client created: ${client.id}`);

      return res.status(201).json({
        success: true,
        client,
      });
    } catch (error) {
      console.error('Error creating client:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return res.status(500).json({
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  }

  /**
   * GET /clients
   * Get all clients
   */
  async getAllClients(_req: Request, res: Response): Promise<Response> {
    try {
      const clients = await clientService.getAllClients();

      return res.status(200).json({
        success: true,
        clients,
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return res.status(500).json({
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  }

  /**
   * GET /clients/:id
   * Get a single client by ID
   */
  async getClientById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      // Validate ID
      if (!id || id.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Client ID is required',
        });
      }

      const client = await clientService.getClientById(id);

      if (!client) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Client not found',
        });
      }

      return res.status(200).json({
        success: true,
        client,
      });
    } catch (error) {
      console.error('Error fetching client:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return res.status(500).json({
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  }
}

export default new ClientController();
