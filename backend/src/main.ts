import { createApp } from './app';
import { loadConfig } from './config';
import { createBackendDeps } from './dependencies';

const config = loadConfig();
const deps = createBackendDeps(config);
const app = createApp(config, deps);

app.listen(config.port, () => {
  console.log(`Backend API listening on port ${config.port}`);
});
