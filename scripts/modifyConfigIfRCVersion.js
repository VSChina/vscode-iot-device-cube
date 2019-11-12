const fs = require('fs');

if (process.env.TRAVIS_TAG) {
  const isTestVersion = /^v?[0-9]+\.[0-9]+\.[0-9]+-[rR][cC]$/.test(process.env.TRAVIS_TAG || '');
  if (isTestVersion) {
    const packageJson = JSON.parse(fs.readFileSync('package.json'));

    const testName = "test-iot-cube";
    const testDisplayName = "Test IoT Cube";
    const testPublisher = "IoTDevExBuild";
    packageJson.name = testName;
    packageJson.displayName = testDisplayName;
    packageJson.publisher = testPublisher;
    packageJson.version = packageJson.version.slice(0, -3);

    delete packageJson.icon;
    delete packageJson.aiKey;

    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
  }
}