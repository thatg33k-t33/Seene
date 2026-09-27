// Seene platform development: one server, owned by this repository.
// External React applications are separate projects; they are never started from here.
import {spawn} from 'node:child_process';

const children=[];
function start(args){const child=spawn(process.execPath,args,{stdio:'inherit',env:process.env});children.push(child);return child}
start(['node_modules/vite/bin/vite.js',...process.argv.slice(2)]);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{for(const child of children)child.kill(signal)});
