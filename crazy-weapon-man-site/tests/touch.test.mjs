import test from 'node:test';
import assert from 'node:assert/strict';
import {joystickVector} from '../game-src/engine/touch-controls.js';
test('joystick dead zone, diagonals and travel clamp',()=>{
  assert.deepEqual(joystickVector(3,4,40).actions,[]);
  assert.deepEqual(joystickVector(35,0,40).actions,['right']);
  assert.deepEqual(joystickVector(-30,-30,40).actions,['left','up']);
  assert.deepEqual(joystickVector(0,100,40).actions,['down']);
  const v=joystickVector(500,-500,40);assert.ok(Math.abs(Math.hypot(v.x,v.y)-40)<0.001);
  assert.deepEqual(v.actions,['right','up']);
});
