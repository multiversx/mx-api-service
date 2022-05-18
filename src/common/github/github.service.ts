import { HttpStatus, Injectable } from "@nestjs/common";
import { BinaryUtils } from "src/utils/binary.utils";
import { ApiConfigService } from "../api-config/api.config.service";
import { ApiService } from "../network/api.service";
import { GithubUserInfo } from "./entities/github.user.info";

@Injectable()
export class GithubService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) { }

  async getUserInfo(username: string): Promise<GithubUserInfo | undefined> {
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
  }

  async getRepoFileContents(username: string, repository: string, path: string): Promise<string | undefined> {
    const result = await this.get(`repos/${username}/${repository}/contents/${path}`);
    if (!result) {
      return undefined;
    }

    return BinaryUtils.base64Decode(result.content);
  }

  private async get(path: string): Promise<any> {
    const headers = this.getHeaders();

    // eslint-disable-next-line require-await
    const result = await this.apiService.get(`https://api.github.com/${path}`, { headers }, async (error) => error.response?.status === HttpStatus.NOT_FOUND);

    return result?.data;
  }

  private getHeaders(): Record<string, string> {
    const token = this.apiConfigService.getGithubToken();
    if (!token) {
      return {};
    }

    return {
      Authorization: `token ${token}`,
    };
  }
}
