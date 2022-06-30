import { Constants } from "@elrondnetwork/erdnest-common";

describe('Constants Utils', () => {
    describe('Constants conversion', () => {
        it('OneMinute', () => {
            expect(Constants.oneMinute()).toStrictEqual(Constants.oneSecond() * 60);
        });
        it('OneHour', () => {
            expect(Constants.oneHour()).toStrictEqual(Constants.oneMinute() * 60);
        });
        it('OneDay', () => {
            expect(Constants.oneDay()).toStrictEqual(Constants.oneHour() * 24);
        });
        it('OneWeek', () => {
            expect(Constants.oneWeek()).toStrictEqual(Constants.oneDay() * 7);
        });
        it('OneMonth', () => {
            expect(Constants.oneMonth()).toStrictEqual(Constants.oneDay() * 30);
        });

    });
});
