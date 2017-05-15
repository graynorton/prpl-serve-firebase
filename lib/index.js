const useragent = require('useragent');

function chooseBuild(ua) {
    const {family, major} = useragent.parse(ua.replace(/ AppEngine.+$/, ''));
    console.log(family, major, ua);
    switch (family) {
        case 'Chrome Mobile':
            return 'es6-unbundled';
        case 'Chrome':
            return (major >= 49) ? 'es6-unbundled' : 'es6-bundled';
        case 'Firefox':
            return (major >= 52) ? 'es6-unbundled' : 'es6-bundled';
        case 'Opera':
            return (major >= 44) ? 'es6-unbundled' : 'es6-bundled';
        case 'IE':
            return 'es5-bundled';
        case 'Edge':
        case 'Safari':
        default:
            return 'es6-bundled';
    }
}

function getRoot(route) {
    const len = route.indexOf('/**');
    return (len === -1) ? undefined : route.substr(0, len);
}

function match(path, mayBeGlob) {
    const root = getRoot(mayBeGlob);
    return root && path.indexOf(root) ===  0;
}

function getLinkHeader(path, build) {
    const { linkHeaders } = build;
    if (linkHeaders[path]) return linkHeaders[path];
    for (let route of Object.keys(linkHeaders)) {
        if (match(path, route)) return linkHeaders[route];
    }
}

function prplServe(builds='builds.js') {
    return (request, response) => {
        const buildType = chooseBuild(request.headers['user-agent']);
        const build = require(`${process.cwd()}/${builds}`)[buildType];
        console.log('path', request.path, 'type', buildType);
        const link = getLinkHeader(request.path, build);
        response.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
        response.set('Vary', 'User-Agent');
        if (link) response.set('Link', link);
        response.send(build.html);
    }
}

exports.prplServe = prplServe;