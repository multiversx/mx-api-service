import { RoundUtils } from "@elrondnetwork/erdnest-common";

describe('Round Utils', () => {
    describe('getExpires', () => {
        it('Check if round get expired', () => {
            expect(RoundUtils.getExpires(522, 131, 131, 5)).toBeGreaterThanOrEqual(1641564794);
        });
        it('Check if epoch is 0', () => {
            const now = Math.floor(Date.now() / 1000);
            expect(RoundUtils.getExpires(0, 131, 131, 5)).toEqual(now);
        });
    });
});
