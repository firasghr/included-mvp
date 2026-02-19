import 'dotenv/config';
import emailService from './services/emailService';

async function sendTestEmail() {
    const to = 'firas22sghairi@gmail.com';
    const subject = 'Test Email from Included MVP (EmailService)';
    const html = '<strong>Hello Firas! This is a test email sent via EmailService class.</strong>';

    console.log(`Testing EmailService integration...`);

    try {
        const result = await emailService.sendEmail(to, subject, html);
        console.log(`Test completed. Result ID: ${result.id}`);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

sendTestEmail().catch(console.error);
