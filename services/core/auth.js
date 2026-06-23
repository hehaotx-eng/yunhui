const { request } = require('./request');

const TOKEN_KEY = 'token';
const USER_KEY = 'userInfo';
const LOGIN_PAGE = '/pages/login/login';
const REDIRECT_KEY = '_loginRedirect';

function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || '';
}

function setToken(token) {
  wx.setStorageSync(TOKEN_KEY, token);
}

function removeToken() {
  wx.removeStorageSync(TOKEN_KEY);
}

function getUserInfo() {
  return wx.getStorageSync(USER_KEY) || null;
}

function setUserInfo(user) {
  wx.setStorageSync(USER_KEY, user);
}

function removeUserInfo() {
  wx.removeStorageSync(USER_KEY);
}

function isLoggedIn() {
  return !!getToken();
}

function isEnterprise() {
  const user = getUserInfo();
  return !!(user && user.company_id);
}

function saveCurrentPage() {
  const pages = getCurrentPages();
  if (pages.length > 0) {
    const current = pages[pages.length - 1];
    let route = '/' + current.route;
    const options = current.options || {};
    const query = Object.keys(options)
      .map(k => `${k}=${options[k]}`)
      .join('&');
    if (query) route += '?' + query;
    wx.setStorageSync(REDIRECT_KEY, route);
  }
}

function handleAuthExpired() {
  removeToken();
  removeUserInfo();
  saveCurrentPage();
  wx.navigateTo({ url: LOGIN_PAGE });
}

function consumeRedirect() {
  const redirect = wx.getStorageSync(REDIRECT_KEY) || '';
  wx.removeStorageSync(REDIRECT_KEY);
  return redirect;
}

async function login(phone, password) {
  if (!phone) throw new Error('请输入手机号');
  if (!password) throw new Error('请输入密码');
  const data = await request({
    url: '/api/v1/users/login',
    method: 'POST',
    data: { phone, password },
    needAuth: false
  });
  if (data && data.token) {
    setToken(data.token);
  }
  if (data && data.user) {
    setUserInfo(data.user);
  }
  return data;
}

function logout() {
  removeToken();
  removeUserInfo();
  wx.reLaunch({ url: LOGIN_PAGE });
}

module.exports = {
  getToken,
  setToken,
  removeToken,
  getUserInfo,
  setUserInfo,
  removeUserInfo,
  isLoggedIn,
  isEnterprise,
  handleAuthExpired,
  consumeRedirect,
  login,
  logout
};
