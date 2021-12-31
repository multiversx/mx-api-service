import{TokenUtils} from "src/utils/token.utils"

describe('Token Utils', () => {
    describe('Token Utils', () => {
        it('Check if is Esdt', () => {
            expect(TokenUtils.isEsdt('EWLD-e23800')).toBeTruthy();
            expect(TokenUtils.isEsdt('MARS-96823d-01')).toBeFalsy();
        });
        it('Check function canBool', () => {
            expect(TokenUtils.canBool('EWLD-e23800')).toBeFalsy();
            expect(TokenUtils.canBool('MARS-96823d-01')).toBeFalsy();
        });
        //ToDo: computeNftUri, getUrlHash, getThumbnailUrlIdentifier
    });
});