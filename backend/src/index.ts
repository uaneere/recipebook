import "dotenv/config";
import { createApp } from "./app";
import { loadEnv } from "./env";

const env = loadEnv(process.env);
const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[backend] listening on http://localhost:${env.PORT}`);
});