import 'src/utils/injectEnv';
import { startServer } from 'src/server';

// be careful with setting a too long name, it will be cut
process.title = 'dap-assets-api';

startServer();
