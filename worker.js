// Sends every other address (the old workers.dev link, www) to withinoracle.app with a permanent
// redirect, keeping the path and query (and the browser keeps any #fragment, such as sign-in tokens).
// Everything on withinoracle.app is served straight from the built app.
const HOME = 'withinoracle.app';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Site-ownership files stay at the old address too, so Google keeps the old property verified
    // (it needs that for the change of address) and search engines can confirm both addresses.
    const proof = /^\/(google[0-9a-f]+\.html|[0-9a-f]{32}\.txt)$/.test(url.pathname);
    if (url.hostname !== HOME && !proof) {
      url.protocol = 'https:';
      url.hostname = HOME;
      url.port = '';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
