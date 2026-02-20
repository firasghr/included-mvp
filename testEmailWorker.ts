import supabase from './database/supabase';
import emailService from './services/emailService';
import { v4 as uuidv4 } from 'uuid';

async function runTest() {
    try {
        console.log('--- Creating dummy email notification ---');

        const dummySummaryId = '00000000-0000-0000-0000-000000000000'; // replace with any valid summary ID from your DB
        const dummyClientId = '00000000-0000-0000-0000-000000000000'; // replace with your client ID (or your own)

        const { data, error } = await supabase
            .from('notification_events')
            .insert([{
                id: uuidv4(),
                client_id: dummyClientId,
                summary_id: dummySummaryId,
                type: 'email',
                status: 'pending',
                created_at: new Date().toISOString(),
            }]);

        if (error) throw error;

        console.log('✅ Dummy notification created:', data);

        console.log('--- Running email worker for the dummy notification ---');

        const pending = await emailService.fetchPendingEmails(10);

        for (const event of pending) {
            // Temporarily override to send to your Gmail
            (event as any).client_id = 'firas22sghairi@gmail.com';
            await emailService.processEmailNotification(event);
        }

        console.log('--- Test complete ---');
    } catch (err) {
        console.error('Test failed:', err);
    }
}

runTest();