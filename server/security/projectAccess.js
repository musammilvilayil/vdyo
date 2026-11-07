export function projectFilter(projectId, userId) {
  if (!projectId || !userId) throw new TypeError('projectId and userId are required');
  return { _id: projectId, 'customer.userId': userId };
}

export function isAssetKeyForProject(key, projectId) {
  return typeof key === 'string' && typeof projectId === 'string' && key.startsWith(`projects/${projectId}/sources/`) && key.length > (`projects/${projectId}/sources/`).length;
}
