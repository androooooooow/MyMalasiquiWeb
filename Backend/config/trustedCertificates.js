import tls from 'node:tls';

// Node does not always use the Windows certificate store unless it is started
// with --use-system-ca. Include those certificates programmatically as well so
// Google token verification works with either `npm run dev` or `node server.js`.
const bundledCertificates = typeof tls.getCACertificates === 'function'
    ? tls.getCACertificates('default')
    : tls.rootCertificates;
const systemCertificates = typeof tls.getCACertificates === 'function'
    ? tls.getCACertificates('system')
    : [];

export const trustedCertificates = [...new Set([...bundledCertificates, ...systemCertificates])];

if (typeof tls.setDefaultCACertificates === 'function') {
    tls.setDefaultCACertificates(trustedCertificates);
}
