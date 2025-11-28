/** Jest configuration for TS + React service layer tests */
module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { isolatedModules: true } }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    roots: ['<rootDir>/src'],
    setupFilesAfterEnv: [],
};
