import { describe, it, expect } from 'vitest';
import { RUTValidator } from './RUTValidator';

describe('RUTValidator', () => {
    it('cleans and formats RUT', () => {
        expect(RUTValidator.clean('12.345.678-5')).toBe('12345678-5');
        expect(RUTValidator.format('12345678-5')).toBe('12.345.678-5');
    });
    it('validates correct DV including K', () => {
        expect(RUTValidator.validate('11111111-1')).toBe(true);
        expect(RUTValidator.validate('20513606-K')).toBe(true);
    });
    it('rejects invalid inputs', () => {
        expect(RUTValidator.validate('')).toBe(false);
        expect(RUTValidator.validate('abc')).toBe(false);
        expect(RUTValidator.validate('1234-9')).toBe(false);
    });
});
