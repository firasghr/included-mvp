/**
 * Report Endpoint Test Suite
 * Tests for GET /report with client filtering and edge cases
 */

import request from 'supertest';
import app from '../orchestrator/index';
import { clearMockData, getMockData } from './__mocks__/supabase.mock';
import {
  resetOpenAIMock,
  setOpenAIMockResponse,
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

describe('Report Endpoint', () => {
  let client1Id: string;
  let client2Id: string;

  beforeEach(async () => {
    clearMockData();
    resetOpenAIMock();

    // Create test clients
    const client1 = await request(app)
      .post('/clients')
      .send({ name: 'Client 1', email: 'client1@test.com' });
    client1Id = client1.body.client.id;

    const client2 = await request(app)
      .post('/clients')
      .send({ name: 'Client 2', email: 'client2@test.com' });
    client2Id = client2.body.client.id;
  });

  afterEach(() => {
    clearMockData();
    resetOpenAIMock();
  });

  describe('GET /report', () => {
    it('should return 400 if clientId is missing', async () => {
      const response = await request(app)
        .get('/report')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
      expect(response.body.message).toContain('clientId');
    });

    it('should return 400 if clientId is empty', async () => {
      const response = await request(app)
        .get('/report?clientId=')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });

    it('should return empty report when client has no tasks', async () => {
      const response = await request(app)
        .get(`/report?clientId=${client1Id}`)
        .expect(200);

      expect(response.body).toHaveProperty('report');
      expect(response.body.report).toContain('📝 Daily Report:');
      expect(response.body.report).toContain('No completed tasks found');
    });

    it('should filter reports by clientId', async () => {
      setOpenAIMockResponse('Client 1 summary.');

      // Create tasks for client 1
      await request(app)
        .post('/task')
        .send({ text: 'Client 1 task 1', clientId: client1Id });

      await request(app)
        .post('/task')
        .send({ text: 'Client 1 task 2', clientId: client1Id });

      // Wait for processing
      await waitForTaskProcessing();

      // Get report for client 1
      const response = await request(app)
        .get(`/report?clientId=${client1Id}`)
        .expect(200);

      expect(response.body.report).toContain('📝 Daily Report:');
      expect(response.body.report).toContain('Client 1 summary');

      // Verify it contains both summaries
      const summaryCount = (response.body.report.match(/Client 1 summary/g) || []).length;
      expect(summaryCount).toBe(2);
    });

    it('should include multiple task summaries correctly', async () => {
      setOpenAIMockResponse('Summary 1');
      await request(app)
        .post('/task')
        .send({ text: 'Task 1', clientId: client1Id });

      await waitForTaskProcessing();

      setOpenAIMockResponse('Summary 2');
      await request(app)
        .post('/task')
        .send({ text: 'Task 2', clientId: client1Id });

      await waitForTaskProcessing();

      setOpenAIMockResponse('Summary 3');
      await request(app)
        .post('/task')
        .send({ text: 'Task 3', clientId: client1Id });

      await waitForTaskProcessing();

      const response = await request(app)
        .get(`/report?clientId=${client1Id}`)
        .expect(200);

      // Should contain all three summaries
      expect(response.body.report).toContain('Summary 1');
      expect(response.body.report).toContain('Summary 2');
      expect(response.body.report).toContain('Summary 3');

      // Verify format
      const lines: string[] = response.body.report.split('\n');
      expect(lines[0]).toContain('📝 Daily Report:');
      expect(lines.filter(line => line.startsWith('- Summary')).length).toBe(3);
    });

    it('should not include other clients tasks in report', async () => {
      setOpenAIMockResponse('Client 1 summary');
      await request(app)
        .post('/task')
        .send({ text: 'Client 1 task', clientId: client1Id });

      setOpenAIMockResponse('Client 2 summary');
      await request(app)
        .post('/task')
        .send({ text: 'Client 2 task', clientId: client2Id });

      await waitForTaskProcessing();

      // Get report for client 1
      const response1 = await request(app)
        .get(`/report?clientId=${client1Id}`)
        .expect(200);

      expect(response1.body.report).toContain('Client 1 summary');
      expect(response1.body.report).not.toContain('Client 2 summary');

      // Get report for client 2
      const response2 = await request(app)
        .get(`/report?clientId=${client2Id}`)
        .expect(200);

      expect(response2.body.report).toContain('Client 2 summary');
      expect(response2.body.report).not.toContain('Client 1 summary');
    });

    it('should ensure complete data isolation between clients', async () => {
      // Create multiple tasks for each client
      setOpenAIMockResponse('Client 1 task A');
      await request(app)
        .post('/task')
        .send({ text: 'Task A', clientId: client1Id });

      setOpenAIMockResponse('Client 1 task B');
      await request(app)
        .post('/task')
        .send({ text: 'Task B', clientId: client1Id });

      setOpenAIMockResponse('Client 2 task X');
      await request(app)
        .post('/task')
        .send({ text: 'Task X', clientId: client2Id });

      setOpenAIMockResponse('Client 2 task Y');
      await request(app)
        .post('/task')
        .send({ text: 'Task Y', clientId: client2Id });

      await waitForTaskProcessing();

      // Verify client 1 report
      const report1 = await request(app)
        .get(`/report?clientId=${client1Id}`)
        .expect(200);

      expect(report1.body.report).toContain('Client 1 task A');
      expect(report1.body.report).toContain('Client 1 task B');
      expect(report1.body.report).not.toContain('Client 2');
      expect(report1.body.report).not.toContain('task X');
      expect(report1.body.report).not.toContain('task Y');

      // Verify client 2 report
      const report2 = await request(app)
        .get(`/report?clientId=${client2Id}`)
        .expect(200);

      expect(report2.body.report).toContain('Client 2 task X');
      expect(report2.body.report).toContain('Client 2 task Y');
      expect(report2.body.report).not.toContain('Client 1');
      expect(report2.body.report).not.toContain('task A');
      expect(report2.body.report).not.toContain('task B');
    });

    it('should not include failed tasks in report', async () => {
      // Create successful task
      setOpenAIMockResponse('Successful summary');
      await request(app)
        .post('/task')
        .send({ text: 'Good task', clientId: client1Id });

      await waitForTaskProcessing();

      // Manually mark a task as failed (simulate failure)
      const mockData = getMockData();
      mockData.tasks.push({
        id: 'failed-task-id',
        input: 'Failed task',
        output: 'Error processing input.',
        status: 'failed',
        client_id: client1Id,
        created_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get(`/report?clientId=${client1Id}`)
        .expect(200);

      // Should only contain successful summary
      expect(response.body.report).toContain('Successful summary');
      expect(response.body.report).not.toContain('Error processing');
      expect(response.body.report).not.toContain('Failed task');

      // Verify only one item in report (the successful one)
      const summaryCount = response.body.report.split('\n').filter(
        (line: string) => line.startsWith('- ')
      ).length;
      expect(summaryCount).toBe(1);
    });

    it('should return summaries in descending order (most recent first)', async () => {
      // Create tasks with slight delays to ensure ordering
      setOpenAIMockResponse('First summary');
      await request(app)
        .post('/task')
        .send({ text: 'First task', clientId: client1Id });
      await waitForTaskProcessing();

      setOpenAIMockResponse('Second summary');
      await request(app)
        .post('/task')
        .send({ text: 'Second task', clientId: client1Id });
      await waitForTaskProcessing();

      setOpenAIMockResponse('Third summary');
      await request(app)
        .post('/task')
        .send({ text: 'Third task', clientId: client1Id });
      await waitForTaskProcessing();

      const response = await request(app)
        .get(`/report?clientId=${client1Id}`)
        .expect(200);

      const report = response.body.report;
      const lines: string[] = report.split('\n');

      // Find summary lines
      const summaryLines = lines.filter((line: string) => line.includes('summary'));

      // Most recent should appear first
      const thirdIndex = summaryLines.findIndex((l: string) => l.includes('Third'));
      const secondIndex = summaryLines.findIndex((l: string) => l.includes('Second'));
      const firstIndex = summaryLines.findIndex((l: string) => l.includes('First'));

      expect(thirdIndex).toBeLessThan(secondIndex);
      expect(secondIndex).toBeLessThan(firstIndex);
    });

    it('should handle special characters in summaries', async () => {
      setOpenAIMockResponse('Summary with "quotes" and \'apostrophes\' & symbols.');
      await request(app)
        .post('/task')
        .send({ text: 'Special chars task', clientId: client1Id });

      await waitForTaskProcessing();

      const response = await request(app)
        .get(`/report?clientId=${client1Id}`)
        .expect(200);

      expect(response.body.report).toContain('"quotes"');
      expect(response.body.report).toContain("'apostrophes'");
      expect(response.body.report).toContain('& symbols');
    });

    it('should handle long summaries correctly', async () => {
      const longSummary = 'This is a very long summary. '.repeat(20);
      setOpenAIMockResponse(longSummary);

      await request(app)
        .post('/task')
        .send({ text: 'Long task', clientId: client1Id });

      await waitForTaskProcessing();

      const response = await request(app)
        .get(`/report?clientId=${client1Id}`)
        .expect(200);

      expect(response.body.report).toContain(longSummary.trim());
    });

    it('should handle report for non-existent client gracefully', async () => {
      const nonExistentClientId = 'non-existent-client-12345';

      const response = await request(app)
        .get(`/report?clientId=${nonExistentClientId}`)
        .expect(200);

      expect(response.body.report).toContain('📝 Daily Report:');
      expect(response.body.report).toContain('No completed tasks found');
    });
  });

  describe('Edge Cases', () => {
    it('should handle report when tasks are still processing', async () => {
      // Mock OpenAI with delay to simulate processing
      mockOpenAI.chat.completions.create.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockOpenAIResponse('Processing summary');
      });

      // Create task but don't wait for processing
      await request(app)
        .post('/task')
        .send({ text: 'Processing task', clientId: client1Id });

      // Get report immediately (task still processing)
      const response = await request(app)
        .get(`/report?clientId=${client1Id}`)
        .expect(200);

      // Should show no completed tasks yet
      expect(response.body.report).toContain('No completed tasks found');

      // Allow the async task to complete cleanup
      await waitForTaskProcessing(600);
    });

    it('should handle concurrent report requests for same client', async () => {
      setOpenAIMockResponse('Concurrent summary');
      await request(app)
        .post('/task')
        .send({ text: 'Task for concurrent test', clientId: client1Id });

      await waitForTaskProcessing();

      // Make multiple concurrent report requests
      const requests = [
        request(app).get(`/report?clientId=${client1Id}`),
        request(app).get(`/report?clientId=${client1Id}`),
        request(app).get(`/report?clientId=${client1Id}`),
      ];

      const responses = await Promise.all(requests);

      // All should succeed with same data
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.report).toContain('Concurrent summary');
      });
    });

    it('should handle empty summary strings', async () => {
      // Manually add a summary with empty string
      const mockData = getMockData();
      mockData.summaries.push({
        id: 'empty-summary-id',
        task_id: 'task-id',
        client_id: client1Id,
        summary: '',
        created_at: new Date().toISOString(),
      });

      const response = await request(app)
        .get(`/report?clientId=${client1Id}`)
        .expect(200);

      // Empty summaries should be filtered out
      const lines: string[] = response.body.report.split('\n');
      const summaryLines = lines.filter((line: string) => line.startsWith('-'));
      expect(summaryLines.length).toBe(0);
    });
  });
});
