module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // SDK 54 / Reanimated 4 moved the worklet babel transform into
      // `react-native-worklets`. The old `react-native-reanimated/plugin`
      // entry is a no-op (and errors if worklets isn't installed) —
      // load worklets/plugin directly and keep it last.
      'react-native-worklets/plugin',
    ],
  };
};
