import test from 'node:test';
import assert from 'node:assert/strict';
import { projectFilter, isAssetKeyForProject } from './projectAccess.js';

test('projectFilter always scopes queries to both project and authenticated owner', () => {
  assert.deepEqual(projectFilter('project-1', 'user-1'), { _id: 'project-1', 'customer.userId': 'user-1' });
  assert.throws(() => projectFilter('project-1', ''), TypeError);
});

test('asset keys must belong to the requested project source prefix', () => {
  assert.equal(isAssetKeyForProject('projects/p1/sources/file.mp4', 'p1'), true);
  assert.equal(isAssetKeyForProject('projects/p2/sources/file.mp4', 'p1'), false);
  assert.equal(isAssetKeyForProject('projects/p1/sources/', 'p1'), false);
  assert.equal(isAssetKeyForProject('../p1/file.mp4', 'p1'), false);
});
