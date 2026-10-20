// Sends every other address (the old workers.dev link, www) to withinoracle.app with a permanent
// redirect, keeping the path and query (and the browser keeps any #fragment, such as sign-in tokens).
// Everything on withinoracle.app is served straight from the built app.
const HOME = 'withinoracle.app';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname !== HOME) {
      url.protocol = 'https:';
      url.hostname = HOME;
      url.port = '';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
