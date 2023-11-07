import { ApiService } from "@multiversx/sdk-nestjs-http";
import { TestingModule, Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { GithubService } from "src/common/github/github.service";

describe('GithubService', () => {
  let service: GithubService;
  const mockApiConfigService = { getGithubToken: jest.fn() };
  const mockApiService = { get: jest.fn(), post: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubService,
        { provide: ApiConfigService, useValue: mockApiConfigService },
        { provide: ApiService, useValue: mockApiService },
      ],
    }).compile();

    service = module.get<GithubService>(GithubService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserInfo', () => {
    it('should return user info if user exists', async () => {
      const mockUserData = {
        name: 'Test User',
        avatar_url: 'http://example.com/avatar.jpg',
        bio: 'This is a test user',
        location: 'Test Location',
        twitter_username: 'testuser',
        blog: 'http://example.com/blog',
      };
      mockApiService.get.mockResolvedValueOnce({ data: mockUserData });
      const result = await service.getUserInfo('testuser');
      expect(result).toEqual({
        username: 'testuser',
        ...mockUserData,
      });
    });

    it('should return undefined if user does not exist', async () => {
      mockApiService.get.mockResolvedValueOnce(null);
      const result = await service.getUserInfo('testuser');
      expect(result).toBeUndefined();
    });

    it('should return undefined if an error occurs', async () => {
      mockApiService.get.mockRejectedValueOnce(new Error('Github API error'));
      jest.spyOn(service['logger'], 'error').mockImplementation(() =>
        " An unhandled error occurred when getting Github user info for username 'testuser'");

      const result = await service.getUserInfo('testuser');
      expect(result).toBeUndefined();
    });
  });


  describe('getRepoFileContents', () => {
    it('should return file contents if file exists', async () => {
      const mockFileData = {
        content: Buffer.from('This is a test file', 'utf-8').toString('base64'),
      };
      mockApiService.get.mockResolvedValueOnce({ data: mockFileData });
      const result = await service.getRepoFileContents('testuser', 'testrepo', 'testfile');
      expect(result).toBe('This is a test file');
    });

    it('should return undefined if file does not exist', async () => {
      mockApiService.get.mockResolvedValueOnce(null);
      const result = await service.getRepoFileContents('testuser', 'testrepo', 'testfile');
      expect(result).toBeUndefined();
    });

    it('should return undefined if an error occurs', async () => {
      mockApiService.get.mockResolvedValueOnce(new Error('Github API error'));
      const result = await service.getRepoFileContents('testuser', 'testrepo', 'testfile');
      expect(result).toBeUndefined();
    });
  });

  describe('get', () => {
    it('should call ApiService.get with correct parameters', async () => {
      const testPath = 'testPath';
      const testToken = 'testToken';

      await (service as any).get(testPath, testToken);

      expect(mockApiService.get).toHaveBeenCalledWith(
        `https://api.github.com/${testPath}`,
        { headers: { Authorization: `token ${testToken}` } },
        expect.any(Function),
      );
    });
  });

  describe('post', () => {
    it('should call ApiService.post with correct parameters', async () => {
      const testPath = 'testPath';
      const testBody = { key: 'value' };
      const testToken = 'testToken';

      await (service as any).post(testPath, testBody, testToken);

      expect(mockApiService.post).toHaveBeenCalledWith(
        `https://api.github.com/${testPath}`,
        testBody,
        { headers: { Authorization: `token ${testToken}` } },
      );
    });
  });
});
