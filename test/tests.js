import {assert} from 'chai';
import {prplServe} from '../lib/index.js';

console.log(process.cwd(), __dirname);

const chrome = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36';
const safari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.1 Safari/603.1.30';
const ie11 = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';

class Response {
    constructor() {
        this.headers = [];
    }

    set(key, value) {
        this.headers[key] = value;
    }

    send(contents) {
        this.sent = contents;
    }
}

class Request {
    constructor(props) {
        Object.assign(this, props);
    }
}

suite('stuff', () => {
  test('prplServe is a function', () => {
      assert.isFunction(prplServe);
  });

  test('prplServe returns a handler function', () => {
    const handler = prplServe();
    assert.isFunction(handler);
  });

  suite('handler function works properly', () => {
    const handler = prplServe({pathToBuilds: 'test/static/builds.json'});
    suite('handle Chrome request', () => {
        const resp = new Response();
        const req = new Request({
            headers: {
                'user-agent': chrome
            },
            path: '/'
        });
        handler(req, resp);
        test('chooses proper build (es6-unbundled)', () => {
            assert.match(resp.sent, /es6\-unbundled/);
        });
    });
    suite('handle Safari request', () => {
        const resp = new Response();
        const req = new Request({
            headers: {
                'user-agent': safari
            },
            path: '/view2'
        });
        handler(req, resp);
        test('chooses proper build (es6-bundled)', () => {
            assert.match(resp.sent, /es6\-bundled/);
        });
        test('chooses proper view (view2)', () => {
            assert.match(resp.headers['Link'], /my\-view2/);
        });
    });
    suite('handle IE11 request', () => {
        const resp = new Response();
        const req = new Request({
            headers: {
                'user-agent': ie11
            },
            path: '/foobar'
        });
        handler(req, resp);
        test('chooses proper build (es5-bundled)', () => {
            assert.match(resp.sent, /es5\-bundled/);
        });
        test('chooses proper view (404)', () => {
            assert.match(resp.headers['Link'], /my\-view404/);
        });
    });
  });
});