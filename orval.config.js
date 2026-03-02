module.exports = {
    bfh: {
        output: {
            mode: 'tags-split',
            target: 'src/api/generated/bfh.ts',
            schemas: 'src/api/generated/model',
            client: 'react-query',
            mock: false,
            override: {
                mutator: {
                    path: './src/api/custom-instance.ts',
                    name: 'customInstance',
                },
            },
        },
        input: {
            target: './openapi3.json',
        },
    },
};
