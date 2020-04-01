const fs = require('fs');

if (process.env.TRAVIS_TAG) {
  const isTestVersion = /^v?[0-9]+\.[0-9]+\.[0-9]+-[rR][cC]/.test(process.env.TRAVIS_TAG || '');
  if (isTestVersion) {
    const packageJson = JSON.parse(fs.readFileSync('package.json'));

    const testName = "test-albatross";
    const testDisplayName = "Test Albatross RC";
    const testPublisher = "IoTDevExBuild";
    packageJson.name = testName;
    packageJson.displayName = testDisplayName;
    packageJson.publisher = testPublisher;
    packageJson.aiKey = process.env['TEST_AIKEY'];

    const indexOfDash = packageJson.version.indexOf('-');
    if (indexOfDash > 0) {
      packageJson.version = packageJson.version.substring(0, indexOfDash);
    }

    delete packageJson.icon;

    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
  }
}