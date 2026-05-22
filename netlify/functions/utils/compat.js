// Vercel → Netlify function adapter
// Wraps a Vercel-style handler(req, res) for Netlify's event/context model
export function netlifyAdapter(handlerFn) {
  return async (event) => {
    let statusCode = 200;
    const responseHeaders = {};

    const req = {
      method: event.httpMethod,
      headers: Object.fromEntries(
        Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), v])
      ),
      body: parseBody(event),
      query: event.queryStringParameters || {},
      ip: event.headers?.['x-forwarded-for'] || event.headers?.['client-ip'] || '127.0.0.1',
      url: event.rawUrl,
    };

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseHeaders['content-type'] = 'application/json; charset=utf-8';
        statusCode = statusCode || 200;
        return { statusCode, headers: responseHeaders, body: JSON.stringify(data) };
      },
      setHeader(key, value) {
        responseHeaders[key.toLowerCase()] = value;
        return this;
      },
      end(body) {
        if (typeof body === 'string') {
          return { statusCode, headers: responseHeaders, body };
        }
        return { statusCode, headers: responseHeaders, body: '' };
      },
    };

    // handler may return a value (some handlers do) or use res.json/res.end
    const result = await handlerFn(req, res);

    // If handler returned something directly, use it
    if (result && typeof result === 'object' && result.body !== undefined) {
      return result;
    }

    // If handler used res.json(), it returned a Netlify-compatible object
    if (result && typeof result === 'object' && result.statusCode !== undefined) {
      return result;
    }

    // Fallback
    return {
      statusCode,
      headers: responseHeaders,
      body: '',
    };
  };
}

function parseBody(event) {
  if (!event.body) return {};
  if (typeof event.body === 'object') return event.body;
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
}
