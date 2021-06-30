import { Injectable, Logger } from "@nestjs/common";
import simpleGit, {SimpleGit, SimpleGitOptions} from 'simple-git';
var rimraf = require("rimraf");

@Injectable()
export class TokenAssetService {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger(TokenAssetService.name);
  }

  async checkout() {
    const localGitPath = 'dist/repos/assets';
    let logger = this.logger;
    rimraf(localGitPath, function () { 
      logger.log("done deleting"); 

      const options: Partial<SimpleGitOptions> = {
        baseDir: process.cwd(),
        binary: 'git',
        maxConcurrentProcesses: 6,
      };
      
      // when setting all options in a single object
      const git: SimpleGit = simpleGit(options);

      git.outputHandler((_, stdout, stderr) => {
        stdout.pipe(process.stdout);
        stderr.pipe(process.stderr)

        stdout.on('data', (data) => {
            // Print data
            logger.log(data.toString('utf8'));
        })
      }).clone('https://github.com/ElrondNetwork/assets.git', localGitPath);
    });
  }
}