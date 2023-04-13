import { ApiService, BinaryUtils, OriginLogger } from "@multiversx/sdk-nestjs";
import { HttpStatus, Injectable } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { GithubUserInfo } from "./entities/github.user.info";

@Injectable()
export class GithubService {
  private readonly logger = new OriginLogger(GithubService.name);

  constructor(
    private readonly apiConfigService: ApiConfigService,
    protected readonly apiService: ApiService,
  ) { }

  async getUserInfo(username: string): Promise<GithubUserInfo | undefined> {
    try {
      const profile = await this.get(`users/${username}`);
      if (!profile) {
        return undefined;
      }

      return {
        username,
        name: profile.name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        location: profile.location,
        twitter_username: profile.twitter_username,
        blog: profile.blog,
      };
    } catch (error) {
      this.logger.error(`An unhandled error occurred when getting Github user info for username '${username}'`);
      this.logger.error(error);
      return undefined;
    }
  }

  async getRepoFileContents(username: string, repository: string, path: string): Promise<string | undefined> {
    const result = await this.get(`repos/${username}/${repository}/contents/${path}`);
    if (!result) {
      return undefined;
    }

    return BinaryUtils.base64Decode(result.content);
  }


  protected async post(path: string, body: any, userToken?: string): Promise<any> {
    const headers = this.getHeaders(userToken);

    const result = await this.apiService.post(`https://api.github.com/${path}`, body, { headers });

    return result?.data;
  }

  protected async get(path: string, userToken?: string): Promise<any> {
    const headers = this.getHeaders(userToken);

    // eslint-disable-next-line require-await
    const result = await this.apiService.get(`https://api.github.com/${path}`, { headers }, async (error) => error.response?.status === HttpStatus.NOT_FOUND);

    return result?.data;
  }

  protected getHeaders(userToken?: string): Record<string, string> {
    const token = userToken ?? this.apiConfigService.getGithubToken();
    if (!token) {
      return {};
    }

    return {
      Authorization: `token ${token}`,
    };
  }
}
