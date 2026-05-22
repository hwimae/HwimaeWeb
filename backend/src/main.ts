import { createApp } from './app';
import { loadConfig } from './config';

const config = loadConfig();
const app = createApp(config);

app.listen(config.port, () => {
  console.log(`Backend API listening on port ${config.port}`);
});
