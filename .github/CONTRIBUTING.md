
# Contributing to api.elrond.com

If you are unfamiliar with the workflow of contributing to github, you can refer to this [this article](https://github.com/firstcontributions/first-contributions/blob/master/README.md)

## Fork & clone this repository

The development should happen in a personal fork, cloned on the local machine.

## Use development branch

Changes should happen against:
- the `development` branch if it is about a new feature
- the `main` branch if the change is a bugfix

## Weapon of choice: Visual Studio Code

We use Visual Studio code internally and have also included some specific settings, such as running ESLint fixes on save, as well as automatic code formatting.

If contributing from other tools such as Jetbrains Webstorm, there might be slight formatting differences which might interfere with later edits from the internal team or from other external contributors.  

## Use linter

Before opening a pull request, run `npm run lint` against your local changes to make sure the code adheres to the accepted standards within the repo.

You can also run `npm run lint:fix` to apply automatic fixes to the code.

## Writing tests

Below some guidelines regarding writing unit tests:
- Attempt to write some unit tests which verify the component in isolation and mock the external components around it
- If the component relies on many other external components which are difficult to mock, write e2e tests for it
- Try to cover both expected functionality but also verify that the code fails in expected ways
- If fixing a bug, try to first write the unit test that exposes the bug, then fix it and have a test that will make sure the specific situation will always be tested in the future

## Make sure the tests pass

To make sure the test suite passes, run the following commands before opening a pull request:
- `npm run test` to run unit tests
- `npm run test:e2e:warm:mocked` to warm-up integration tests with mocked data, for performance purposes
- `npm run test:e2e` to run integration tests

## Manual testing

Although the nominal use case looks good, the linter runs without issues, as well as the unit & e2e tests pass without any error, some unforeseen bugs may arise.

That's why, every change, however small, should be tested thoroughly with the mindset of "How can I make the code break" by testing its limits, sending unsanitized inputs, trying to extract a lot more data than needed, etc. It will help minimize the friction between the developer and the reviewer. It will also make sure the PR gets approved & deployed faster.
