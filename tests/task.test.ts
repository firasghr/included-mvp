/**
 * Task Endpoint Test Suite
 * Tests for POST /task with async LLM processing
 */

import request from 'supertest';
import app from '../orchestrator/index';
import { clearMockData, getMockData } from './__mocks__/supabase.mock';
import {
  resetOpenAIMock,
  setOpenAIMockResponse,
  setOpenAIMockError,
  mockOpenAI,
  mockOpenAIResponse,
} from './__mocks__/openai.mock';

const waitForTaskProcessing = async (maxMs: number = 4000) => {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const mockData = getMockData();
    const hasPending = mockData.tasks.some(
      (t) => t.status === 'pending' || t.status === 'processing'
    );
    if (!hasPending && mockData.tasks.length > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};

describe('Task Endpoint', () => {
  let testClientId: string;

  beforeEach(async () => {
    clearMockData();
    resetOpenAIMock();

    // Create a test client for tasks
    const clientResponse = await request(app)
      .post('/clients')
      .send({ name: 'Test Client', email: 'test@client.com' });
    testClientId = clientResponse.body.client.id;
  });

  afterEach(() => {
    clearMockData();
    resetOpenAIMock();
  });

  describe('POST /task', () => {
    it('should create a task with valid clientId and text', async () => {
      // Mock with delay to allow checking pending state
      mockOpenAI.chat.completions.create.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return mockOpenAIResponse('Summary: Test task completed successfully.');
      });
      const taskData = {
        text: 'This is a test task to be summarized.',
        clientId: testClientId,
      };

      const response = await request(app)
        .post('/task')
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('taskId');
      expect(['pending', 'processing']).toContain(response.body.status);

      // Verify task was created in database
      const mockData = getMockData();
      expect(mockData.tasks).toHaveLength(1);
      expect(mockData.tasks[0]).toMatchObject({
        input: 'This is a test task to be summarized.',
        client_id: testClientId,
        output: null,
      });
      expect(['pending', 'processing']).toContain(mockData.tasks[0].status);
    });

    it('should return 400 if text is missing', async () => {
      const taskData = {
        clientId: testClientId,
      };

      const response = await request(app)
        .post('/task')
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
      expect(response.body.message).toContain('non-empty "text" field');
    });

    it('should return 400 if text is empty string', async () => {
      const taskData = {
        text: '',
        clientId: testClientId,
      };

      const response = await request(app)
        .post('/task')
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });

    it('should return 400 if clientId is missing', async () => {
      const taskData = {
        text: 'Task without clientId',
      };

      const response = await request(app)
        .post('/task')
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
      expect(response.body.message).toContain('non-empty "clientId" field');
    });

    it('should return 400 if clientId is empty string', async () => {
      const taskData = {
        text: 'Test task',
        clientId: '',
      };

      const response = await request(app)
        .post('/task')
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });

    it('should process task asynchronously through LLM worker', async () => {
      // Mock with delay to allow checking pending state
      mockOpenAI.chat.completions.create.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return mockOpenAIResponse('Summary: Test task completed successfully.');
      });

      const taskData = {
        text: 'Process this task through LLM.',
        clientId: testClientId,
      };

      const response = await request(app)
        .post('/task')
        .send(taskData)
        .expect(201);

      const taskId = response.body.taskId;

      // Initially task should be pending or processing
      const mockData = getMockData();
      expect(['pending', 'processing']).toContain(mockData.tasks[0].status);

      // Wait for async processing
      await waitForTaskProcessing();

      // After processing, task should be completed
      const task = mockData.tasks.find((t) => t.id === taskId);
      expect(task.status).toBe('completed');
      expect(task.output).toBe('Summary: Test task completed successfully.');

      // Verify OpenAI was called
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    it('should verify task status transitions: pending -> processing -> completed', async () => {
      // Mock with delay to allow checking pending state
      mockOpenAI.chat.completions.create.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return mockOpenAIResponse('Completed summary.');
      });

      const taskData = {
        text: 'Track status transitions.',
        clientId: testClientId,
      };

      const response = await request(app)
        .post('/task')
        .send(taskData)
        .expect(201);

      const taskId = response.body.taskId;
      const mockData = getMockData();

      // 1. Initially: pending or processing (race condition)
      let task = mockData.tasks.find((t) => t.id === taskId);
      expect(['pending', 'processing']).toContain(task.status);

      // 2. Wait a bit for processing to start/continue (but not finish)
      // Use explicit small delay, not waitForTaskProcessing which waits for completion
      await new Promise((resolve) => setTimeout(resolve, 50));
      task = mockData.tasks.find((t) => t.id === taskId);
      expect(task.status).toBe('processing');

      // 3. Wait for completion
      await waitForTaskProcessing();
      task = mockData.tasks.find((t) => t.id === taskId);
      expect(task.status).toBe('completed');
      expect(task.output).toBe('Completed summary.');
    });

    it('should store summary in summaries table after completion', async () => {
      setOpenAIMockResponse('This is the summary stored in DB.');

      const taskData = {
        text: 'Task with summary storage.',
        clientId: testClientId,
      };

      const response = await request(app)
        .post('/task')
        .send(taskData)
        .expect(201);

      const taskId = response.body.taskId;

      // Wait for async processing
      await waitForTaskProcessing();

      // Verify summary was created
      const mockData = getMockData();
      expect(mockData.summaries).toHaveLength(1);
      expect(mockData.summaries[0]).toMatchObject({
        task_id: taskId,
        client_id: testClientId,
        summary: 'This is the summary stored in DB.',
      });
    });

    it('should handle failed LLM processing', async () => {
      // Mock OpenAI to throw an error
      setOpenAIMockError(new Error('OpenAI API error'));

      const taskData = {
        text: 'This task will fail.',
        clientId: testClientId,
      };

      const response = await request(app)
        .post('/task')
        .send(taskData)
        .expect(201);

      const taskId = response.body.taskId;

      // Wait for async processing (retries take time)
      await waitForTaskProcessing(4000);

      // Task should be marked as failed
      const mockData = getMockData();
      const task = mockData.tasks.find((t) => t.id === taskId);
      expect(task.status).toBe('failed');
      expect(task.output).toBe('Error processing input.');

      // No summary should be created for failed tasks
      expect(mockData.summaries).toHaveLength(0);
    });

    it('should handle empty LLM response as error', async () => {
      // Mock empty response
      setOpenAIMockResponse('');

      const taskData = {
        text: 'Task with empty response.',
        clientId: testClientId,
      };

      await request(app).post('/task').send(taskData).expect(201);

      // Wait for async processing (retries take time)
      await waitForTaskProcessing(4000);

      const mockData = getMockData();
      const task = mockData.tasks[0];
      expect(task.status).toBe('failed');
    });

    it('should create notification events after task completion', async () => {
      setOpenAIMockResponse('Summary for notifications.');

      const taskData = {
        text: 'Task with notifications.',
        clientId: testClientId,
      };

      await request(app).post('/task').send(taskData).expect(201);

      // Wait for async processing
      await waitForTaskProcessing();

      // Verify notification events were created
      const mockData = getMockData();
      expect(mockData.notification_events.length).toBeGreaterThanOrEqual(2);

      // Should have email and whatsapp notifications
      const emailNotif = mockData.notification_events.find(
        (n) => n.type === 'email'
      );
      const whatsappNotif = mockData.notification_events.find(
        (n) => n.type === 'whatsapp'
      );

      expect(emailNotif).toBeDefined();
      expect(emailNotif.status).toBe('pending');
      expect(emailNotif.client_id).toBe(testClientId);

      expect(whatsappNotif).toBeDefined();
      expect(whatsappNotif.status).toBe('pending');
      expect(whatsappNotif.client_id).toBe(testClientId);
    });

    it('should handle multiple tasks for same client', async () => {
      setOpenAIMockResponse('Summary for multiple tasks.');

      // Create multiple tasks
      const _task1 = await request(app)
        .post('/task')
        .send({ text: 'Task 1', clientId: testClientId })
        .expect(201);

      const _task2 = await request(app)
        .post('/task')
        .send({ text: 'Task 2', clientId: testClientId })
        .expect(201);

      const _task3 = await request(app)
        .post('/task')
        .send({ text: 'Task 3', clientId: testClientId })
        .expect(201);

      // Wait for all to process
      await waitForTaskProcessing();

      const mockData = getMockData();
      expect(mockData.tasks).toHaveLength(3);
      expect(mockData.summaries).toHaveLength(3);

      // All should be completed
      mockData.tasks.forEach((task) => {
        expect(task.status).toBe('completed');
        expect(task.client_id).toBe(testClientId);
      });
    });

    it('should handle tasks from different clients independently', async () => {
      // Create another client
      const client2Response = await request(app)
        .post('/clients')
        .send({ name: 'Client 2' });
      const client2Id = client2Response.body.client.id;

      setOpenAIMockResponse('Client-specific summary.');

      // Create tasks for different clients
      await request(app)
        .post('/task')
        .send({ text: 'Client 1 task', clientId: testClientId })
        .expect(201);

      await request(app)
        .post('/task')
        .send({ text: 'Client 2 task', clientId: client2Id })
        .expect(201);

      await waitForTaskProcessing();

      const mockData = getMockData();
      expect(mockData.tasks).toHaveLength(2);
      expect(mockData.summaries).toHaveLength(2);

      // Verify client isolation
      const client1Summary = mockData.summaries.find(
        (s) => s.client_id === testClientId
      );
      const client2Summary = mockData.summaries.find(
        (s) => s.client_id === client2Id
      );

      expect(client1Summary).toBeDefined();
      expect(client2Summary).toBeDefined();
      expect(client1Summary.client_id).not.toBe(client2Summary.client_id);
    });
  });

  describe('LLM Worker Retry Logic', () => {
    it('should retry on LLM failure up to 3 times', async () => {
      // Mock to fail twice then succeed
      mockOpenAI.chat.completions.create
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Success on attempt 3' } }],
        });

      const taskData = {
        text: 'Task with retries.',
        clientId: testClientId,
      };

      await request(app).post('/task').send(taskData).expect(201);

      // Wait for retries to complete (with backoff delays: 1s + 2s + exec time)
      await waitForTaskProcessing(4500);

      // Should eventually succeed
      const mockData = getMockData();
      const task = mockData.tasks[0];
      expect(task.status).toBe('completed');
      expect(task.output).toBe('Success on attempt 3');

      // Verify 3 attempts were made
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(3);
    });

    it('should fail after 3 retry attempts', async () => {
      // Mock to fail all attempts
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('Persistent failure')
      );

      const taskData = {
        text: 'Task that fails permanently.',
        clientId: testClientId,
      };

      await request(app).post('/task').send(taskData).expect(201);

      // Wait for all retries (1s + 2s + 4s + exec time)
      await waitForTaskProcessing(8000);

      const mockData = getMockData();
      const task = mockData.tasks[0];
      expect(task.status).toBe('failed');
      expect(task.output).toBe('Error processing input.');

      // Should have attempted 3 times
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(3);
    });
  });
});
