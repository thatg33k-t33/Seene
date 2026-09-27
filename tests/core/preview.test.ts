import {expect,it} from 'vitest';
import {presentPreview,RESOURCES} from '../../src/core';
it('shares canonical revision validation',()=>{
 expect(RESOURCES['present-preview']).toBe(presentPreview);
 const result=presentPreview({scene:{version:3,camera:{},focus:{},nodes:[{id:'host'}]}});
 expect(result.valid).toBe(true);
 if(result.valid)expect(result.definition.width).toBe(1400);
});
it.each([
 {scene:{nodes:[{id:'a'},{id:'a'}]}},
 {scene:{version:3,camera:{},focus:{distance:5},nodes:[]}},
 {scene:{version:3,camera:{},focus:{},nodes:[]},width:0},
 {scene:{version:3,camera:{},focus:{},nodes:[]},motion:{durationMs:100,tracks:[{target:{kind:'surface',id:'missing'},property:'x',keyframes:[{timeMs:0,value:20}]}]}},
])('rejects invalid source revision %j',input=>expect(presentPreview(input).valid).toBe(false));
