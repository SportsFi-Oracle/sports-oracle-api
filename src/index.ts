import { writeProvider } from "../utils/utils";
import { OracleManager } from "./oracles/OraclesManager";

async function bootstrap() {
  try {
    const network = await writeProvider.getNetwork();
    console.log(`Connected to ${network.name} (chainId ${network.chainId})`);
    console.log("Starting oracle updater…\n");
  } catch (e) {
    console.error("Network connection failed.", e);
    process.exit(1);
  }

  const manager = new OracleManager();
  manager.start();
}

bootstrap();