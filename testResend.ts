import { Resend } from "resend";

// Make sure your RESEND_API_KEY is in your env
const resend = new Resend(process.env.RESEND_API_KEY!);

async function run() {
    try {
        console.log("Sending test email...");

        const response = await resend.emails.send({
            from: "firas22sghairi@gmail.com",  // temporarily use your Gmail
            to: "firas22sghairi@gmail.com",
            subject: "Included — Test Email",
            html: "<p>Hello Firas, this is a test email from Node.js!</p>",
        });

        console.log("✅ Email sent successfully!");
        console.log("Response:", response);
    } catch (err) {
        console.error("❌ Failed to send email:", err);
    }
}

run();