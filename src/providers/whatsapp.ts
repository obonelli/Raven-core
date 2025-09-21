export async function sendWhatsApp(input: { to: string; text: string }) {
    if (process.env.NODE_ENV !== 'production') {
        console.log('[whatsapp:mock]', input);
        return;
    }
    // TODO: integrate Twilio/Tyntec provider
}
