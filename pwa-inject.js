const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf-8');

const pwaTags = `
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#0a0a23">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Speed Music">
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
    <link rel="apple-touch-icon" sizes="152x152" href="/assets/icon-152.png">
    <link rel="apple-touch-icon" sizes="167x167" href="/assets/icon-167.png">`;

html = html.replace('</head>', pwaTags + '\n  </head>');

fs.writeFileSync(indexPath, html);
console.log('PWA tags injected into dist/index.html');
