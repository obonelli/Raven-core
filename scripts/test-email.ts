import 'dotenv/config';
import { sendEmail } from '../src/providers/email';

(async () => {
    try {
        const res = await sendEmail({
            to: 'bonelli.personal@gmail.com',
            subject: 'Test Raven Assist ✔',
            text: 'Hola 👋, este es un test enviado con SendGrid desde Raven-core.',
        });
        console.log('Resultado:', res);
    } catch (err) {
        console.error('Error enviando email:', err);
    }
})();
