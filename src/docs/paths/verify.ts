// Paths: phone verification (start / confirm)
export const verifyPaths = {
    '/api/verify/phone/start': {
        post: {
            tags: ['Verify'],
            summary: 'Start phone verification (send OTP via WhatsApp/SMS)',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/VerifyStartInput' },
                        examples: {
                            mx: { value: { phone: '+52 55 1111 2222' } },
                            e164: { value: { phone: '+525511112222' } },
                        },
                    },
                },
            },
            responses: {
                '204': { description: 'OTP sent' },
                '400': {
                    description: 'Invalid phone or missing prerequisites',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/VerifyError' },
                            examples: {
                                invalid: { value: { error: 'invalid_phone', message: 'Invalid phone' } },
                                missing: { value: { error: 'otp_missing', message: 'No code requested' } },
                            },
                        },
                    },
                },
                '429': {
                    description: 'Rate limited / cooldown active',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/VerifyError' },
                            examples: {
                                limited: { value: { error: 'rate_limited', message: 'Rate limited' } },
                            },
                        },
                    },
                },
            },
        },
    },

    '/api/verify/phone/confirm': {
        post: {
            tags: ['Verify'],
            summary: 'Confirm phone verification (validate OTP)',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/VerifyConfirmInput' },
                        examples: {
                            ok: { value: { phone: '+525511112222', code: '123456' } },
                        },
                    },
                },
            },
            responses: {
                '204': { description: 'Verified' },
                '400': {
                    description: 'Invalid / expired OTP or phone mismatch',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/VerifyError' },
                            examples: {
                                invalid: { value: { error: 'otp_invalid', message: 'Invalid code' } },
                                expired: { value: { error: 'otp_expired', message: 'OTP expired' } },
                                mismatch: { value: { error: 'phone_mismatch', message: 'Phone mismatch' } },
                            },
                        },
                    },
                },
                '429': {
                    description: 'Too many attempts',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/VerifyError' },
                            examples: {
                                attempts: { value: { error: 'too_many_attempts', message: 'Too many attempts' } },
                            },
                        },
                    },
                },
            },
        },
    },
};
