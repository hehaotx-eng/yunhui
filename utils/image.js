const { BASE_URL } = require('./api');

const cache = {};

function resolve(url) {
  if (!url) return '';
  if (url.startsWith('/uploads/') || url.startsWith('/images/')) return `${BASE_URL}${url}`;
  return url;
}

function download(url) {
  const absUrl = resolve(url);
  if (!absUrl) return Promise.resolve('');
  if (cache[absUrl]) return Promise.resolve(cache[absUrl]);
  return new Promise((resolve) => {
    wx.downloadFile({
      url: absUrl,
      success: (res) => {
        if (res.statusCode === 200 && res.tempFilePath) {
          cache[absUrl] = res.tempFilePath;
          resolve(res.tempFilePath);
        } else {
          resolve(absUrl);
        }
      },
      fail: () => resolve(absUrl)
    });
  });
}

function batchDownload(list, urlField) {
  return Promise.all((list || []).map(item =>
    download(item[urlField]).then(localPath => ({
      ...item,
      [`_${urlField}`]: localPath
    }))
  ));
}

module.exports = { resolve, download, batchDownload };
