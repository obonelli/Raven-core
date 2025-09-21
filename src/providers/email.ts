export async function sendEmail(input: { to: string; subject: string; text: string }) {
    if (process.env.NODE_ENV !== 'production') {
        console.log('[email:mock]', input);
        return;
    }
    // TODO: integrate Resend/SendGrid
}
