import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

import supabase from './database/supabase';
import emailService from './services/emailService';

async function runEmailFlowTest() {
    const resultSummary: any = {
        steps: {},
        success: false,
        finalError: null
    };

    try {
        // 1. Create a test client
        const clientId = uuidv4();
        const testEmail = 'firas22sghairi@gmail.com';

        const { data: client, error: clientError } = await supabase
            .from('clients')
            .insert([
                {
                    id: clientId,
                    name: 'Test Client',
                    email: testEmail,
                    inbound_email: `client_${clientId}@included.yourdomain.com`,
                },
            ])
            .select()
            .single();

        if (clientError) throw new Error(`Failed to create client: ${clientError.message}`);
        resultSummary.steps.clientCreation = { status: 'success', id: client.id, email: testEmail };

        // 2. Create a test task 
        const taskId = uuidv4();
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .insert([
                {
                    id: taskId,
                    client_id: clientId,
                    input: 'test input',
                    status: 'completed'
                },
            ])
            .select()
            .single();

        if (taskError) {
            resultSummary.steps.taskCreation = { status: 'failed', error: taskError.message };
        } else {
            resultSummary.steps.taskCreation = { status: 'success', id: task.id };
        }

        // 3. Create a test summary
        const summaryId = uuidv4();
        const { data: summary, error: summaryError } = await supabase
            .from('summaries')
            .insert([
                {
                    id: summaryId,
                    client_id: clientId,
                    task_id: taskId,
                    summary: 'This is a test summary for email notification testing.',
                },
            ])
            .select()
            .single();

        if (summaryError) throw new Error(`Failed to create summary: ${summaryError.message}`);
        resultSummary.steps.summaryCreation = { status: 'success', id: summary.id };

        // 4. Create a pending notification event
        const eventId = uuidv4();
        const { data: event, error: eventError } = await supabase
            .from('notification_events')
            .insert([
                {
                    id: eventId,
                    client_id: clientId,
                    summary_id: summaryId,
                    type: 'email',
                    status: 'pending',
                },
            ])
            .select()
            .single();

        if (eventError) throw new Error(`Failed to create notification event: ${eventError.message}`);
        resultSummary.steps.notificationCreation = { status: 'success', id: event.id, notificationStatus: 'pending' };

        // 5. Process the notification using EmailService
        // We override console.error locally to capture Resend errors if the original function swallows it
        const originalConsoleError = console.error;
        let capturedError: any = null;
        console.error = (...args) => {
            capturedError = args.join(' ');
            // originalConsoleError(...args); // Optional: keep it silent for JSON output
        };

        // Also silence standard logs to keep JSON clean
        const originalConsoleLog = console.log;
        console.log = () => { };

        const isSuccess = await emailService.processEmailNotification(event);

        console.error = originalConsoleError;
        console.log = originalConsoleLog;

        if (isSuccess) {
            resultSummary.steps.emailSending = { status: 'success', message: 'Email passed to Resend successfully' };
            resultSummary.success = true;
        } else {
            resultSummary.steps.emailSending = {
                status: 'failed',
                error: capturedError || 'Unknown error during email sending',
                message: 'Email sending failed'
            };

            // Also fetch the updated notification to see if it was marked failed
            const { data: updatedEvent } = await supabase
                .from('notification_events')
                .select('status')
                .eq('id', eventId)
                .single();

            if (updatedEvent) {
                resultSummary.steps.emailSending.eventFinalStatus = updatedEvent.status;
            }
        }

    } catch (error: any) {
        resultSummary.finalError = error.message || String(error);
    }

    console.log(JSON.stringify(resultSummary, null, 2));
}

runEmailFlowTest().then(() => {
    process.exit(0);
});
