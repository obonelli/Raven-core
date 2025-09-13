// src/docs/components/userDetails.schemas.ts
export const userDetailsSchemas = {
    UserDetails: {
        type: 'object',
        required: ['userId'],
        properties: {
            userId: { type: 'string', format: 'uuid' },
            phone: { type: ['string', 'null'] },
            address: { type: ['string', 'null'] },
            city: { type: ['string', 'null'] },
            country: { type: ['string', 'null'] },
            zip: { type: ['string', 'null'] },
        },
    },
    CreateUserDetailsInput: {
        type: 'object',
        properties: {
            phone: { type: ['string', 'null'] },
            address: { type: ['string', 'null'] },
            city: { type: ['string', 'null'] },
            country: { type: ['string', 'null'] },
            zip: { type: ['string', 'null'] },
        },
        example: {
            phone: '+52 55 1111 2222',
            address: 'Calle 1 #23',
            city: 'Guadalajara',
            country: 'MX',
            zip: '44100',
        },
    },
    PatchUserDetailsInput: {
        type: 'object',
        properties: {
            phone: { type: ['string', 'null'] },
            address: { type: ['string', 'null'] },
            city: { type: ['string', 'null'] },
            country: { type: ['string', 'null'] },
            zip: { type: ['string', 'null'] },
        },
        example: { phone: '+52 55 9999 0000' },
    },
};
