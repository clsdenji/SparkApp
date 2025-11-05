// smaller / hideable glossy bar (no design change, just scaled + hide/reveal)
import React, { useRef, useState, useEffect } from "react";
import { Tabs } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  Pressable,
  LayoutChangeEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

const GOLD = "#FFD700";
const GOLD_DARK = "#C9A300";
const INACTIVE = "rgba(255,255,255,0.55)";
const BG = "#0e0e0f";
const BAR_BG = "rgba(18,18,18,0.92)";

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  map: "navigate-circle",
  saved: "heart-circle",
  history: "time",
  profile: "person-circle",
};

// ---- tiny global bridge so any screen can hide/show the bar without extra files
let _setForcedHidden: ((v: boolean) => void) | null = null;
export const hideTabBar = () => _setForcedHidden?.(true);
export const showTabBar = () => _setForcedHidden?.(false);

function GlossyTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  // programmatic visibility
  const [forcedHidden, setForcedHidden] = useState(false);
  useEffect(() => {
    _setForcedHidden = setForcedHidden;
    return () => {
      if (_setForcedHidden === setForcedHidden) _setForcedHidden = null;
    };
  }, []);

  // compute if current route wants to hide (route option) OR forced hidden
  const currentKey = state.routes[state.index].key;
  const currentOpts = descriptors[currentKey]?.options ?? {};
  const shouldHide =
    forcedHidden || currentOpts?.tabBarStyle?.display === "none";

  // wrapper translate for hide/show animation
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(translateY, {
      toValue: shouldHide ? 100 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [shouldHide, translateY]);

  // sliding indicator state (smaller)
  const [barW, setBarW] = useState(0);
  const tabW = Math.max(barW / Math.max(state.routes.length, 1), 1);
  const slideX = useRef(new Animated.Value(state.index * tabW)).current;

  const onBarLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width - 26; // (13+13) inner padding
    setBarW(w);
    slideX.setValue(state.index * (w / state.routes.length));
  };

  useEffect(() => {
    Animated.spring(slideX, {
      toValue: state.index * tabW,
      useNativeDriver: false,
      bounciness: 10,
      speed: 14,
    }).start();
  }, [state.index, tabW, slideX]);

  // bottom handle (visible only when hidden)
  const handleTap = () => {
    Haptics.selectionAsync().catch(() => {});
    showTabBar();
  };

  return (
    <>
      {shouldHide && (
        <Pressable
          onPress={handleTap}
          style={[styles.handle, { paddingBottom: Math.max(insets.bottom, 6) }]}
          android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: true }}
        >
          <View style={styles.handleDot} />
        </Pressable>
      )}

      <Animated.View
        style={[
          styles.wrap,
          { paddingBottom: Math.max(insets.bottom, 8), transform: [{ translateY }] },
        ]}
      >
        <LinearGradient
          colors={["rgba(255,215,0,0.08)", "transparent"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.glowUnder}
        />
        <View style={styles.barShadow} />
        <View style={styles.bar} onLayout={onBarLayout}>
          {!!barW && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.slider,
                {
                  width: tabW - 12,
                  transform: [
                    { translateX: Animated.add(slideX, new Animated.Value(6)) as any },
                  ],
                },
              ]}
            />
          )}

          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel ?? options.title ?? route.name;

            const scale = useRef(new Animated.Value(isFocused ? 1.06 : 1)).current;
            const rise = useRef(new Animated.Value(isFocused ? -5 : 0)).current;

            useEffect(() => {
              Animated.parallel([
                Animated.spring(scale, {
                  toValue: isFocused ? 1.06 : 1,
                  friction: 6,
                  useNativeDriver: true,
                }),
                Animated.timing(rise, {
                  toValue: isFocused ? -5 : 0,
                  duration: 200,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
              ]).start();
            }, [isFocused, rise, scale]);

            const iconName = ICONS[route.name] ?? "ellipse";

            const onPress = () => {
              const evt = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !evt.defaultPrevented) {
                Haptics.selectionAsync().catch(() => {});
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={styles.item}
                android_ripple={{ color: "rgba(255,255,255,0.05)", borderless: true }}
              >
                <Animated.View style={{ transform: [{ translateY: rise }, { scale }] }}>
                  {isFocused && <View style={styles.neonRing} />}
                  <Ionicons
                    name={iconName}
                    size={24}
                    color={isFocused ? GOLD : INACTIVE}
                  />
                </Animated.View>
                <Text style={[styles.label, { color: isFocused ? GOLD : INACTIVE }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </>
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <Tabs screenOptions={{ headerShown: false }} tabBar={(p) => <GlossyTabBar {...p} />}>
        {/* Example: this one shows the bar */}
        <Tabs.Screen name="map" options={{ title: "Map" }} />

        {/* Example: this one auto-hides the bar via route options */}
        <Tabs.Screen
          name="saved"
          options={{
            title: "Saved",
            // Remove the next line if you DON'T want this one hidden
            // tabBarStyle: { display: "none" },
          }}
        />

        <Tabs.Screen name="history" options={{ title: "History" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  // summon handle (shows when bar is hidden)
  handle: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  handleDot: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  wrap: { position: "absolute", left: 0, right: 0, bottom: 0 },
  glowUnder: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 60,
    height: 34,
    borderRadius: 18,
  },
  barShadow: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 12,
    height: 84,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    ...(Platform.OS === "web" ? { filter: "blur(10px)" as any } : {}),
  },
  bar: {
    marginHorizontal: 6,
    marginVertical: 6,
    backgroundColor: BAR_BG,
    borderRadius: 20,
    paddingVertical: 8, // smaller
    paddingHorizontal: 13, // smaller
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    shadowColor: GOLD_DARK,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    overflow: "hidden",
  },
  slider: {
    position: "absolute",
    top: 6,
    bottom: 30, // leaves room for labels
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  item: { flex: 1, alignItems: "center", paddingTop: 4, paddingBottom: 8 },
  label: { marginTop: 3, fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
  neonRing: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 16,
    backgroundColor: "transparent",
    shadowColor: GOLD,
    shadowOpacity: 0.65,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
});
