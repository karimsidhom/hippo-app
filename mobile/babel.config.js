module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated plugin MUST be listed last — see
      // https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started#babel-plugin
      'react-native-reanimated/plugin',
    ],
  };
};
