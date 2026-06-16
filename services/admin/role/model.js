function createRole(data = {}) {
  return {
    id: data.id || '',
    name: data.name || '',
    permissions: data.permissions || [],
    created_at: data.created_at || ''
  };
}

function createTag(data = {}) {
  return {
    id: data.id || '',
    name: data.name || '',
    category: data.category || ''
  };
}

module.exports = { createRole, createTag };
