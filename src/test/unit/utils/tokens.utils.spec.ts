import{TokenUtils} from "src/utils/token.utils"

describe('Token Utils', () => {
    describe('isEsdt', () => {
        it('Check if is Esdt', () => {
            expect(TokenUtils.isEsdt('EWLD-e23800')).toBeTruthy();
            expect(TokenUtils.isEsdt('MARS-96823d-01')).toBeFalsy();
        });
    });
    describe('canBool', () => {
        it('Check function canBool', () => {
            expect(TokenUtils.canBool('EWLD-e23800')).toBeFalsy();
            expect(TokenUtils.canBool('MARS-96823d-01')).toBeFalsy();
        });
    });
    describe('getUrlHash', () => {
        it('Check function getUrlHash', () => {
            expect(TokenUtils.getUrlHash('https://media.elrond.com/nfts/asset/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6/914.png')).toStrictEqual('947a3912');
        });
    });
    describe('getThumbnailUrlIdentifier', () => {
        it('Check function getThumbnailUrlIdentifier', () => {
            expect(TokenUtils.getThumbnailUrlIdentifier('MOS-b9b4b2-2710','https://media.elrond.com/nfts/asset/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6/914.png'))
                .toStrictEqual('MOS-b9b4b2-947a3912');

        });
    });

});

