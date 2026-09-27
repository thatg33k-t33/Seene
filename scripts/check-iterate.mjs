// Exercise the installed product against actual Vite edits in a disposable host.
process.env.SEENE_VERIFY_ITERATE = '1';
await import('./check-installed.mjs');
