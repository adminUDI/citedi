import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import worker from './worker/index.js';

mkdirSync('data', {recursive: true});
const database = new DatabaseSync('data/portal.sqlite');
database.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000');
database.exec(readFileSync(new URL('./drizzle/0000_cms.sql', import.meta.url), 'utf8').replaceAll('CREATE TABLE ', 'CREATE TABLE IF NOT EXISTS '));
const DB = {
  prepare(sql) {
    return this.bindStatement(sql, []);
  },
  bindStatement(sql, parameters) {
    const statement = database.prepare(sql);
    return {
      bind: (...values) => this.bindStatement(sql, values),
      first: async () => statement.get(...parameters) ?? null,
      all: async () => ({results: statement.all(...parameters)}),
      run: async () => ({meta: {changes: Number(statement.run(...parameters).changes)}})
    };
  }
};
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const origin = process.env.PUBLIC_ORIGIN || 'http://127.0.0.1:' + port;
createServer(async (req, res) => {
  try {
    const method = req.method;
    const options = {method, headers: req.headers};
    if (!['GET', 'HEAD'].includes(method)) Object.assign(options, {body: Readable.toWeb(req), duplex: 'half'});
    const response = await worker.fetch(new Request(origin + req.url, options), {DB, CMS_SETUP_KEY: process.env.CMS_SETUP_KEY});
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body && method !== 'HEAD') Readable.fromWeb(response.body).pipe(res);
    else res.end();
  } catch (error) {
    console.error(error);
    res.writeHead(500).end('Error del servidor');
  }
}).listen(port, host, () => console.log('Portal: ' + origin + ' | Panel: ' + origin + '/admin'));
