const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    const orderPath = [
      'tokens.cs-e2e.ts',
      'collections.cs-e2e.ts',
      'nfts.cs-e2e.ts',
      'network.cs-e2e.ts',
      'hello.cs-e2e.ts',
      'blocks.cs-e2e.ts',
      'delegation.cs-e2e.ts',
      'delegation-legacy.cs-e2e.ts',
      'accounts.cs-e2e.ts',
      'stake.cs-e2e.ts',
      'rounds.cs-e2e.ts',
      'results.cs-e2e.ts',
      'miniblocks.cs-e2e.ts',
    ];

    return tests.sort((testA, testB) => {
      const indexA = orderPath.findIndex(path => testA.path.includes(path));
      const indexB = orderPath.findIndex(path => testB.path.includes(path));

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) {
        return -1;
      }
      if (indexB !== -1) {
        return 1;
      }
      // the files not listed above share one chain, so the order they run in decides the state each
      // of them sees. leaving it to the order jest discovered them in makes that differ between runs
      return testA.path.localeCompare(testB.path);
    });
  }
}

module.exports = CustomSequencer; 
