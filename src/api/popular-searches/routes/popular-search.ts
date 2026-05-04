export default {
  routes: [
    {
      method: 'GET',
      path: '/search/popular',
      handler: 'popular-search.popularSearches',
      config: {
        auth: false,
      },
    },
  ],
};
