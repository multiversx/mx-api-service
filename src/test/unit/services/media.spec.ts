import { ApiService } from "@multiversx/sdk-nestjs-http";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { MediaService } from "src/endpoints/media/media.service";

describe('MediaService', () => {
  let mediaService: MediaService;
  let apiConfigService: ApiConfigService;
  let apiService: ApiService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: ApiConfigService,
          useValue: {
            getNetwork: jest.fn(),
            isMediaRedirectFeatureEnabled: jest.fn(),
            getMediaRedirectFileStorageUrls: jest.fn(),
          },
        },
        {
          provide: ApiService,
          useValue: {
            head: jest.fn(),
          },
        },
      ],
    }).compile();

    mediaService = moduleRef.get<MediaService>(MediaService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);
    apiService = moduleRef.get<ApiService>(ApiService);
  });

  describe('redirectToMediaUri', () => {
    it('should throw BadRequestException when media redirect feature is disabled', async () => {
      jest.spyOn(apiConfigService, 'isMediaRedirectFeatureEnabled').mockReturnValueOnce(false);

      await expect(mediaService.getRedirectUrl('url')).rejects.toThrowError('Media redirect is not allowed');
    });

    it('should return redirect url for providers logos', async () => {
      jest.spyOn(apiConfigService, 'isMediaRedirectFeatureEnabled').mockReturnValueOnce(true);

      const uri = 'providers/asset/test.png';
      const expectedUri = 'keybase_processed_uploads/test.png';
      const expectedUrl = `https://s3.amazonaws.com/${expectedUri}`;

      const result = await mediaService.getRedirectUrl(uri);

      expect(result).toBe(expectedUrl);
    });

    it('should return redirect url for tokens logos', async () => {
      jest.spyOn(apiConfigService, 'isMediaRedirectFeatureEnabled').mockReturnValueOnce(true);

      const network = 'devnet';
      jest.spyOn(apiConfigService, 'getNetwork').mockReturnValueOnce(network);

      const uri = 'tokens/asset/test.png';
      const expectedUri = `multiversx/mx-assets/master/${network}/tokens/test.png`;
      const expectedUrl = `https://raw.githubusercontent.com/${expectedUri}`;

      const result = await mediaService.getRedirectUrl(uri);

      expect(result).toBe(expectedUrl);
    });

    it('should return redirect url for tokens logos on mainnet', async () => {
      jest.spyOn(apiConfigService, 'isMediaRedirectFeatureEnabled').mockReturnValueOnce(true);
      jest.spyOn(apiConfigService, 'getNetwork').mockReturnValueOnce('mainnet');

      const uri = 'tokens/asset/test.png';
      const expectedUri = `multiversx/mx-assets/master/tokens/test.png`;
      const expectedUrl = `https://raw.githubusercontent.com/${expectedUri}`;

      const result = await mediaService.getRedirectUrl(uri);

      expect(result).toBe(expectedUrl);
    });

    it('should return redirect url to storage urls', async () => {
      jest.spyOn(apiConfigService, 'isMediaRedirectFeatureEnabled').mockReturnValueOnce(true);
      jest.spyOn(apiConfigService, 'getMediaRedirectFileStorageUrls').mockReturnValueOnce(['https://s3.amazonaws.com']);
      jest.spyOn(apiService, 'head').mockResolvedValueOnce({ status: 200 });

      const uri = 'test.png';
      const expectedUrl = `https://s3.amazonaws.com/${uri}`;

      const result = await mediaService.getRedirectUrl(uri);

      expect(result).toBe(expectedUrl);
    });

    it('should return undefined when not found in file storage urls', async () => {
      jest.spyOn(apiConfigService, 'isMediaRedirectFeatureEnabled').mockReturnValueOnce(true);
      jest.spyOn(apiConfigService, 'getMediaRedirectFileStorageUrls').mockReturnValueOnce(['https://s3.amazonaws.com']);
      jest.spyOn(apiService, 'head').mockResolvedValueOnce({ status: 404 });

      const uri = 'test.png';

      const result = await mediaService.getRedirectUrl(uri);

      expect(result).toBeUndefined();
    });

    it('should return redirect url for nfts assets', async () => {
      jest.spyOn(apiConfigService, 'isMediaRedirectFeatureEnabled').mockReturnValueOnce(true);
      jest.spyOn(apiConfigService, 'getMediaRedirectFileStorageUrls').mockReturnValueOnce([]);

      const uri = 'nfts/asset/test.png';
      const expectedUri = `ipfs/test.png`;
      const expectedUrl = `https://ipfs.io/${expectedUri}`;

      const result = await mediaService.getRedirectUrl(uri);

      expect(result).toBe(expectedUrl);
    });

    it('should return redirect to fallback thumbnail if not found in file storage urls', async () => {
      jest.spyOn(apiConfigService, 'isMediaRedirectFeatureEnabled').mockReturnValueOnce(true);
      jest.spyOn(apiConfigService, 'getMediaRedirectFileStorageUrls').mockReturnValueOnce(['https://s3.amazonaws.com']);
      jest.spyOn(apiService, 'head').mockResolvedValueOnce({ status: 404 });

      const uri = 'nfts/thumbnail/random';
      const expectedUrl = `https://s3.amazonaws.com/nfts/thumbnail/default.png`;

      const result = await mediaService.getRedirectUrl(uri);

      expect(result).toBe(expectedUrl);
    });
  });
});
