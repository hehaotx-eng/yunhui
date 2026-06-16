module.exports = {
  createUser(data = {}) {
    return {
      id: data.id || '',
      phone: data.phone || '',
      name: data.name || '',
      avatar: data.avatar || '',
      company_id: data.company_id || null,
      role: data.role || 'user',
      status: data.status || 'active',
      created_at: data.created_at || ''
    };
  }
};
