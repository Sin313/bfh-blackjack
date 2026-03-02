module.exports = {
    bfh: {
        input: 'https://api.bravefrontierheroes.com/swagger/doc.json',
        output: {
            target: 'src/api/generated/bfh.ts',
            client: 'react-query',
        },
    },
};
