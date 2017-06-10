const fs = require('fs');
const {browserCapabilities} = require('@graynorton/prpl-server/lib/capabilities.js');
const {loadBuilds} = require('@graynorton/prpl-server/lib/prpl.js');
const minimatch = require('minimatch');

function chooseBuild(ua, buildMeta) {
    const buildNames = Object.keys(buildMeta);
    const builds = loadBuilds(
        '/',
        { builds: buildNames.map(k => buildMeta[k]) },
        { skipCheck: true }
    );
    const capabilities = browserCapabilities(ua);
    const build = builds.find(b => b.canServe(browserCapabilities(ua)));
    return buildNames[build.configOrder];
}

function getLinkHeader(path, build) {
    const { linkHeaders } = build;
    if (linkHeaders[path]) return linkHeaders[path];
    for (let route of Object.keys(linkHeaders)) {
        if (minimatch(path, route)) return linkHeaders[route];
    }
}

function prplServe(inOptions) {
    const options = Object.assign({}, prplServeDefaults, inOptions);
    return (request, response) => {
        const { pathToBuilds, chooseBuild } = options;
        const builds = JSON.parse(fs.readFileSync(`${process.cwd()}/${pathToBuilds}`, 'utf-8'));
        const buildName = chooseBuild(request.headers['user-agent'], builds);
        const build = builds[buildName];
        const link = getLinkHeader(request.path, build);
        if (link) response.set('Link', link);
        response.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
        response.set('Vary', 'User-Agent');
        response.send(build.html);
        console.log(`path: '${request.path}', build: '${buildName}'`);
    }
}

const prplServeDefaults = {
    pathToBuilds: 'builds.json',
    chooseBuild: chooseBuild
}

exports.prplServe = prplServe;