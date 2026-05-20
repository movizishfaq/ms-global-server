import { connectDb } from '../src/db/connect.js';
import { createApp } from '../src/app.js';
const app = createApp();
export default async function handler(req, res) {
    await connectDb();
    app(req, res);
}
//# sourceMappingURL=index.js.map