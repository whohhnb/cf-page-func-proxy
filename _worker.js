// 在 export default 前添加
async function streamBodyWithReplace(reader, writer, proxyHostname, originHostname) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split(/(\s+)/);
    buffer = chunks.pop();
    
    for (const chunk of chunks) {
      const processed = chunk.replace(
        new RegExp(`(?<!\\.)\\b${proxyHostname}\\b`, "g"),
        originHostname
      );
      await writer.write(encoder.encode(processed));
    }
  }
  
  if (buffer) {
    const processed = buffer.replace(
      new RegExp(`(?<!\\.)\\b${proxyHostname}\\b`, "g"),
      originHostname
    );
    await writer.write(encoder.encode(processed));
  }
}

// 修改 fetch 函数内部分
const url = new URL(request.url);
const originHostname = url.hostname;

// 端口处理增强
const [targetHost, targetPort] = PROXY_HOSTNAME.split(':');
url.hostname = targetHost;
url.port = targetPort || (PROXY_PROTOCOL === 'https' ? '443' : '80');

// 添加超时控制
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

try {
  const originalResponse = await fetch(newRequest, {
    signal: controller.signal
  });
  clearTimeout(timeoutId);

  // 流式处理优化
  if (contentType.includes("text/")) {
    body = await replaceResponseText(...);
  } else {
    const { readable, writable } = new TransformStream();
    ctx.waitUntil(streamBodyWithReplace(
      originalResponse.body.getReader(),
      writable.getWriter(),
      PROXY_HOSTNAME,
      originHostname
    ));
    body = readable;
  }
} catch (err) {
  if (err.name === 'AbortError') {
    logError(request, "Upstream timeout");
    return new Response("Service Unavailable", { status: 503 });
  }
  throw err;
}
