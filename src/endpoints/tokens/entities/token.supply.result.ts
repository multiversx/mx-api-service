export class TokenSupplyResult {
  supply: string | number = '';
  circulatingSupply: string | number = '';
  minted: string | number | undefined;
  burnt: string | number | undefined;
  initialMinted: string | number | undefined;
}
