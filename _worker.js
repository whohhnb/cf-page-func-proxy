addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  // 关键：指定目标域名和端口
  url.hostname = "cn-cd.whohh.cn";
  url.port = "18096";  // 显式声明非标准端口
  url.protocol = "http:"; // 强制HTTP协议
  return fetch(new Request(url, request));
}
