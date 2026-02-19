/**
 * Inbound Email Routes Test Suite
 * Tests for POST /webhooks/resend-inbound
 */

import request from 'supertest';
import app from '../orchestrator/index';
import { clearMockData } from './__mocks__/supabase.mock';
import inboundEmailService from '../services/inboundEmailService';

// Mock the service so route tests stay fast and isolated
jest.mock('../services/inboundEmailService', () => ({
  __esModule: true,
  default: {
    processInboundEmail: jest.fn(),
  },
}));

const mockProcessInboundEmail = inboundEmailService.processInboundEmail as jest.MockedFunction<
  typeof inboundEmailService.processInboundEmail
>;

const validPayload = {
  from: 'sender@example.com',
  to: 'client_77fa1cc0-f5b0-459e-9164-a997cef8a3f9@included.yourdomain.com',
  subject: 'Test subject',
  text: 'Test body',
  html: '<p>Test body</p>',
};

const mockEmail = {
  id: 'email-id-1',
  client_id: '77fa1cc0-f5b0-459e-9164-a997cef8a3f9',
  sender: 'sender@example.com',
  subject: 'Test subject',
  body: 'Test body',
  status: 'pending' as const,
  source: 'inbound' as const,
  created_at: new Date().toISOString(),
};

describe('POST /webhooks/resend-inbound', () => {
  beforeEach(() => {
    clearMockData();
    jest.clearAllMocks();
  });

  afterEach(() => {
    clearMockData();
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------
  it('should return { success: true } for a valid payload', async () => {
    mockProcessInboundEmail.mockResolvedValue(mockEmail);

    const response = await request(app)
      .post('/webhooks/resend-inbound')
      .send(validPayload)
      .expect(200);

    expect(response.body).toEqual({ success: true });
    expect(mockProcessInboundEmail).toHaveBeenCalledTimes(1);
    expect(mockProcessInboundEmail).toHaveBeenCalledWith({
      from: validPayload.from,
      to: validPayload.to,
      subject: validPayload.subject,
      text: validPayload.text,
      html: validPayload.html,
    });
  });

  it('should accept a payload without optional html field', async () => {
    mockProcessInboundEmail.mockResolvedValue(mockEmail);

    const { html: _html, ...payloadNoHtml } = validPayload;

    const response = await request(app)
      .post('/webhooks/resend-inbound')
      .send(payloadNoHtml)
      .expect(200);

    expect(response.body).toEqual({ success: true });
    expect(mockProcessInboundEmail).toHaveBeenCalledWith(
      expect.objectContaining({ html: undefined })
    );
  });

  // -------------------------------------------------------------------------
  // Validation – missing / empty required fields
  // -------------------------------------------------------------------------
  it.each([
    ['from', { ...validPayload, from: undefined }],
    ['from', { ...validPayload, from: '' }],
    ['to', { ...validPayload, to: undefined }],
    ['to', { ...validPayload, to: '' }],
    ['subject', { ...validPayload, subject: undefined }],
    ['subject', { ...validPayload, subject: '' }],
    ['text', { ...validPayload, text: undefined }],
    ['text', { ...validPayload, text: '' }],
  ])('should return 400 when "%s" is missing or empty', async (field, payload) => {
    const response = await request(app)
      .post('/webhooks/resend-inbound')
      .send(payload)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Invalid payload');
    expect(response.body.message).toContain(field);
    expect(mockProcessInboundEmail).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Service errors propagated as 500
  // -------------------------------------------------------------------------
  it('should return 500 when the service throws (client not found)', async () => {
    mockProcessInboundEmail.mockRejectedValue(new Error('Client not found: abc-123'));

    const response = await request(app)
      .post('/webhooks/resend-inbound')
      .send(validPayload)
      .expect(500);

    expect(response.body).toHaveProperty('error', 'Internal server error');
    expect(response.body.message).toContain('Client not found');
  });

  it('should return 500 when the service throws a generic error', async () => {
    mockProcessInboundEmail.mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app)
      .post('/webhooks/resend-inbound')
      .send(validPayload)
      .expect(500);

    expect(response.body).toHaveProperty('error', 'Internal server error');
    expect(response.body.message).toContain('Database connection failed');
  });
});
