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
    <link rel="apple-touch-icon" href="/assets/icon.png">`;

html = html.replace('</head>', pwaTags + '\n  </head>');

fs.writeFileSync(indexPath, html);
console.log('PWA tags injected into dist/index.html');
