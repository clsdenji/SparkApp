module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],  // includes expo-router in SDK 50+
    plugins: [
      ['module-resolver', { alias: { 'SparkApp': '.', '@': '.' } }],
      'react-native-reanimated/plugin' // keep last
    ],
  };
};
