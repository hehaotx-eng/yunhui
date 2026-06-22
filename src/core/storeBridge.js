/*
 * storeBridge.js — store ↔ core 事件桥接层
 *
 * 职责：
 *   - 将 store 的数据变化桥接到 core 事件系统
 *   - 使 UI / plugins 可以监听 store 变化而不直接引用 store
 *
 * 治理规则：
 *   ✔ 仅做数据→事件的映射
 *   ❌ 不包含任何业务逻辑
 *   ❌ 不修改任何数据
 */

function createStoreBridge(core, store) {
  if (!core || !store) return;

  store.user.subscribe(function (key, val) {
    if (key === 'id') {
      if (val) core.emit('user:login', { userId: val });
      else core.emit('user:logout');
    }
  });

  store.app.subscribe(function (key, val) {
    if (key === 'unreadCount') core.emit('chat:unreadChange', { count: val });
    if (key === 'isEnterprise') core.emit('user:roleChange', { isEnterprise: val });
  });

  store.chat.subscribe(function (key, val) {
    if (key === 'currentConversationId' && val) core.emit('chat:conversationOpen', { conversationId: val });
  });
}

module.exports = { createStoreBridge: createStoreBridge };
