/**
 * Client Endpoints Test Suite
 * Tests for POST /clients, GET /clients, GET /clients/:id
 */

import request from 'supertest';
import app from '../orchestrator';
import { clearMockData, getMockData } from './__mocks__/supabase.mock';

describe('Client Endpoints', () => {
  // Setup and teardown
  beforeEach(() => {
    clearMockData();
  });

  afterEach(() => {
    clearMockData();
  });

  describe('POST /clients', () => {
    it('should create a new client with valid data', async () => {
      const clientData = {
        name: 'Test Company',
        email: 'test@company.com',
        company: 'Test Corp',
      };

      const response = await request(app)
        .post('/clients')
        .send(clientData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('client');
      expect(response.body.client).toMatchObject({
        name: 'Test Company',
        email: 'test@company.com',
        company: 'Test Corp',
      });
      expect(response.body.client).toHaveProperty('id');
      expect(response.body.client).toHaveProperty('created_at');

      // Verify client was added to mock database
      const mockData = getMockData();
      expect(mockData.clients).toHaveLength(1);
      expect(mockData.clients[0].name).toBe('Test Company');
    });

    it('should create a client with only required name field', async () => {
      const clientData = {
        name: 'Minimal Client',
      };

      const response = await request(app)
        .post('/clients')
        .send(clientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.client.name).toBe('Minimal Client');
      expect(response.body.client.email).toBeNull();
      expect(response.body.client.company).toBeNull();
    });

    it('should trim whitespace from client fields', async () => {
      const clientData = {
        name: '  Whitespace Client  ',
        email: '  test@email.com  ',
        company: '  Test Company  ',
      };

      const response = await request(app)
        .post('/clients')
        .send(clientData)
        .expect(201);

      expect(response.body.client.name).toBe('Whitespace Client');
      expect(response.body.client.email).toBe('test@email.com');
      expect(response.body.client.company).toBe('Test Company');
    });

    it('should return 400 if name is missing', async () => {
      const clientData = {
        email: 'test@company.com',
      };

      const response = await request(app)
        .post('/clients')
        .send(clientData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
      expect(response.body.message).toContain('non-empty "name" field');
    });

    it('should return 400 if name is empty string', async () => {
      const clientData = {
        name: '',
      };

      const response = await request(app)
        .post('/clients')
        .send(clientData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });

    it('should return 400 if name is only whitespace', async () => {
      const clientData = {
        name: '   ',
      };

      const response = await request(app)
        .post('/clients')
        .send(clientData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });

    it('should return 400 if name is not a string', async () => {
      const clientData = {
        name: 123,
      };

      const response = await request(app)
        .post('/clients')
        .send(clientData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });
  });

  describe('GET /clients', () => {
    it('should return an empty list when no clients exist', async () => {
      const response = await request(app)
        .get('/clients')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('clients');
      expect(response.body.clients).toEqual([]);
    });

    it('should return a list of all clients', async () => {
      // Create multiple clients
      await request(app)
        .post('/clients')
        .send({ name: 'Client 1', email: 'client1@test.com' });

      await request(app)
        .post('/clients')
        .send({ name: 'Client 2', email: 'client2@test.com' });

      await request(app)
        .post('/clients')
        .send({ name: 'Client 3', company: 'Company 3' });

      const response = await request(app)
        .get('/clients')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.clients).toHaveLength(3);

      // Verify clients are ordered by created_at descending (most recent first)
      const clients = response.body.clients;
      expect(clients[0].name).toBe('Client 3');
      expect(clients[1].name).toBe('Client 2');
      expect(clients[2].name).toBe('Client 1');
    });

    it('should include all client fields in response', async () => {
      await request(app)
        .post('/clients')
        .send({
          name: 'Full Client',
          email: 'full@test.com',
          company: 'Full Company',
        });

      const response = await request(app)
        .get('/clients')
        .expect(200);

      const client = response.body.clients[0];
      expect(client).toHaveProperty('id');
      expect(client).toHaveProperty('name', 'Full Client');
      expect(client).toHaveProperty('email', 'full@test.com');
      expect(client).toHaveProperty('company', 'Full Company');
      expect(client).toHaveProperty('created_at');
      expect(client).toHaveProperty('updated_at');
    });
  });

  describe('GET /clients/:id', () => {
    it('should return a single client by ID', async () => {
      // Create a client
      const createResponse = await request(app)
        .post('/clients')
        .send({
          name: 'Single Client',
          email: 'single@test.com',
          company: 'Single Corp',
        });

      const clientId = createResponse.body.client.id;

      // Fetch the client by ID
      const response = await request(app)
        .get(`/clients/${clientId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('client');
      expect(response.body.client).toMatchObject({
        id: clientId,
        name: 'Single Client',
        email: 'single@test.com',
        company: 'Single Corp',
      });
    });

    it('should return 404 for non-existent client ID', async () => {
      const nonExistentId = 'non-existent-id-12345';

      const response = await request(app)
        .get(`/clients/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not found');
      expect(response.body.message).toContain('Client not found');
    });

    it('should return 400 if ID is empty', async () => {
      const response = await request(app)
        .get('/clients/%20')
        .expect(400); // Express router treats this as not found

      // This will match the 400 validation handler
      expect(response.body.error).toBe('Invalid request');
    });

    it('should return correct client when multiple clients exist', async () => {
      // Create multiple clients
      await request(app)
        .post('/clients')
        .send({ name: 'Client 1' });

      const client2 = await request(app)
        .post('/clients')
        .send({ name: 'Client 2' });

      await request(app)
        .post('/clients')
        .send({ name: 'Client 3' });

      // Fetch specific client
      const response = await request(app)
        .get(`/clients/${client2.body.client.id}`)
        .expect(200);

      expect(response.body.client.id).toBe(client2.body.client.id);
      expect(response.body.client.name).toBe('Client 2');
    });
  });

  describe('Integration: Client CRUD flow', () => {
    it('should handle complete client lifecycle', async () => {
      // 1. Create a client
      const createResponse = await request(app)
        .post('/clients')
        .send({
          name: 'Lifecycle Client',
          email: 'lifecycle@test.com',
        })
        .expect(201);

      const clientId = createResponse.body.client.id;

      // 2. Verify it appears in the list
      const listResponse = await request(app)
        .get('/clients')
        .expect(200);

      expect(listResponse.body.clients).toHaveLength(1);
      expect(listResponse.body.clients[0].id).toBe(clientId);

      // 3. Fetch it by ID
      const getResponse = await request(app)
        .get(`/clients/${clientId}`)
        .expect(200);

      expect(getResponse.body.client.id).toBe(clientId);
      expect(getResponse.body.client.name).toBe('Lifecycle Client');
    });

    it('should handle multiple clients independently', async () => {
      // Create first client
      const client1 = await request(app)
        .post('/clients')
        .send({ name: 'Client A', email: 'a@test.com' })
        .expect(201);

      // Create second client
      const client2 = await request(app)
        .post('/clients')
        .send({ name: 'Client B', email: 'b@test.com' })
        .expect(201);

      // Verify both exist
      const listResponse = await request(app).get('/clients').expect(200);
      expect(listResponse.body.clients).toHaveLength(2);

      // Verify each can be fetched independently
      const get1 = await request(app)
        .get(`/clients/${client1.body.client.id}`)
        .expect(200);
      expect(get1.body.client.name).toBe('Client A');

      const get2 = await request(app)
        .get(`/clients/${client2.body.client.id}`)
        .expect(200);
      expect(get2.body.client.name).toBe('Client B');
    });
  });
});
