import test from 'node:test';
import assert from 'node:assert/strict';
import {joystickVector, buttonAt} from '../game-src/engine/touch-controls.js';
test('joystick dead zone, diagonals and travel clamp',()=>{
  assert.deepEqual(joystickVector(3,4,40).actions,[]);
  assert.deepEqual(joystickVector(35,0,40).actions,['right']);
  assert.deepEqual(joystickVector(-30,-30,40).actions,['left','up']);
  assert.deepEqual(joystickVector(0,100,40).actions,['down']);
  const v=joystickVector(500,-500,40);assert.ok(Math.abs(Math.hypot(v.x,v.y)-40)<0.001);
  assert.deepEqual(v.actions,['right','up']);
});
test('a thumb resting a little low or high never presses DOWN or UP', () => {
  assert.deepEqual(joystickVector(36, 14, 40).actions, ['right']);
  assert.deepEqual(joystickVector(-36, -18, 40).actions, ['left']);
  assert.deepEqual(joystickVector(10, 30, 40).actions, ['down']);
  assert.deepEqual(joystickVector(20, 30, 40).actions, ['right', 'down']);
});
test('the pad picks the nearest button in reach, and nothing in the gap', () => {
  const B = [{ action: 'attack', cx: 100, cy: 100, r: 46 }, { action: 'jump', cx: 10, cy: 140, r: 39 }];
  assert.equal(buttonAt(B, 120, 110).action, 'attack');
  assert.equal(buttonAt(B, 20, 130).action, 'jump');
  assert.equal(buttonAt(B, 300, 300), null);
  assert.equal(buttonAt(B, 100, 150, 1), null);
  assert.equal(buttonAt(B, 100, 150, 1.3).action, 'attack');
});
