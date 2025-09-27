// Components: schemas for phone verification
export const verifySchemas = {
    VerifyStartInput: {
        type: 'object',
        required: ['phone'],
        properties: {
            phone: { type: 'string', minLength: 6, maxLength: 20, description: 'E.164 phone (+5255...)' },
        },
        example: { phone: '+525511112222' },
    },

    VerifyConfirmInput: {
        type: 'object',
        required: ['phone', 'code'],
        properties: {
            phone: { type: 'string', minLength: 6, maxLength: 20 },
            code: { type: 'string', minLength: 4, maxLength: 8 },
        },
        example: { phone: '+525511112222', code: '123456' },
    },

    VerifyError: {
        type: 'object',
        properties: {
            error: {
                type: 'string',
                description:
                    'Machine-readable code. Examples: invalid_phone, rate_limited, otp_invalid, otp_expired, phone_mismatch, too_many_attempts',
            },
            message: { type: 'string' },
        },
        example: { error: 'otp_invalid', message: 'Invalid code' },
    },
};
