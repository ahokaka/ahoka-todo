import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import * as THREE from '../src/vendor/three.module.min.js';

const source = readFileSync(new URL('../src/spiral.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cards = JSON.parse(html.match(/id="spiralData">(.*?)<\/script>/s)[1]);
assert.equal(cards.length, 37);
assert.equal(cards.filter(card => card.featured).length, 1);
assert.equal(cards.find(card => card.featured).href, './minesweeper/index.html');
assert.equal((source.match(/meshes\.push\(mesh\)/g) || []).length, 1, 'One mesh per card');
const constants = ['P', 'CARD_ASPECT', 'CARD_H', 'CARD_W', 'STEP', 'STEP_NARROW'].map(name => source.match(new RegExp(`const ${name} = [\\s\\S]*?;`))[0]).join('\n');
const meshes = cards.map(() => new THREE.Object3D());
const geometryCode = source.slice(source.indexOf('function geomParams()'), source.indexOf('/* 视野自适应'));
for (const width of [390, 1280]) {
  runInNewContext(constants + geometryCode + '\nlayout();', { meshes, N: cards.length, stageSize: () => ({w:width,h:800}) });
  assert(meshes.every(m => [...m.position, ...m.rotation.toArray().slice(0,3)].every(Number.isFinite)));
  assert.equal(new Set(meshes.map(m => m.position.y)).size, cards.length);
  assert(meshes.some(m => m.position.z > 0) && meshes.some(m => m.position.z < 0), 'Spiral retains depth');
}

const handlers = {};
const S = { spin:0, spinVel:0.15, pull:0, dragging:false };
const context = {S, hovered:-1, CARDS:[{href:'./minesweeper/index.html'}],
  hit:{addEventListener:(name,fn)=>handlers[name]=fn, setPointerCapture:()=>{}, style:{}},
  stage:{getBoundingClientRect:()=>({left:0,top:0,width:1000,height:800})},
  pick:()=>0, clamp:(v,a,b)=>Math.min(b,Math.max(a,v)), window:{location:{href:''}}};
runInNewContext(source.slice(source.indexOf('let downPt ='),source.indexOf('let paused =')),context);
const down = {isPrimary:true,button:0,pointerId:1,clientX:100,clientY:100,timeStamp:0};
handlers.pointerdown(down);
handlers.pointermove({...down,clientX:200,timeStamp:20});
assert.equal(S.spin,0.5,'Dragging directly changes rotation');
assert(S.pull > 0 && S.pull <= 3,'Release velocity is bounded');
handlers.pointermove({...down,timeStamp:40});
handlers.pointerup();
handlers.click(down);
assert.equal(context.window.location.href,'','Returning to the starting point must not turn a drag into a click');
handlers.pointerdown(down); handlers.pointerup(); handlers.click(down);
assert.equal(context.window.location.href,'./minesweeper/index.html');
handlers.pointerdown(down); handlers.pointercancel(); assert.equal(S.dragging,false);
console.log('PASS: spiral geometry, unique meshes, direct drag, bounded inertia, cancellation and card navigation.');
