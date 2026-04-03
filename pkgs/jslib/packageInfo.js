import packageJson from './package.json' with { type: 'json' };

const { name, version, dependencies } = packageJson;

export {
  name,
  version,
  dependencies
}
