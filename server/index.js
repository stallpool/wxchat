const i_utils = require('./utils');
const i_worker = require('./worker');
const i_ws = require('./websocket');
const i_api = require('./api');

const server = i_utils.WebServer.create({ api: i_api });

i_worker.cronCleanAuthToken();
i_ws.init(server, '/ws');

const server_port = parseInt(process.env.WXCHAT_PORT || '20201');
const server_host = process.env.WXCHAT_HOST ||'127.0.0.1';

const instance = server.listen(server_port, server_host, () => {
   console.log(`wxChat is listening at ${server_host}:${server_port}`);
})
