import { Tabs } from "expo-router";
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef, useEffect, memo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACCENT = "#E10600";
const TAB_CONTENT_HEIGHT = 64;

// ─── MD3 colours ─────────────────────────────────────────────────────────────
const MD3_SURFACE_CONTAINER = "#2B2930";
const MD3_ON_SURFACE_VARIANT = "#CAC4D0";
const MD3_ON_SURFACE = "#E6E1E5";
const MD3_INDICATOR = "rgba(225, 6, 0, 0.18)";

type TabIconProps = {
  focused: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
};

// ─── MD3 Animated Tab Icon ───────────────────────────────────────────────────
const TabIcon = memo(({ focused, icon, label }: TabIconProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;
  const pillOpacity = useRef(new Animated.Value(0)).current;
  const pillScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.15 : 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.6,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(pillScale, {
        toValue: focused ? 1 : 0,
        useNativeDriver: true,
      }),
      Animated.timing(pillOpacity, {
        toValue: focused ? 1 : 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <View style={styles.tabItem}>
      {/* MD3 Indicator */}
      <Animated.View
        style={[
          styles.indicator,
          { opacity: pillOpacity, transform: [{ scaleX: pillScale }] },
        ]}
      />

      <Animated.View style={{ transform: [{ scale: scaleAnim }], zIndex: 1 }}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={focused ? ACCENT : MD3_ON_SURFACE_VARIANT}
        />
      </Animated.View>

      <Animated.Text
        style={[
          styles.label,
          {
            color: focused ? MD3_ON_SURFACE : MD3_ON_SURFACE_VARIANT,
            opacity: opacityAnim,
            fontWeight: focused ? "600" : "400",
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
    </View>
  );
});

// ─── Custom Tab Bar (MD3 for all platforms) ───────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          height: TAB_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.pressable}
              android_ripple={{
                color: "rgba(225, 6, 0, 0.12)",
                borderless: true,
              }}
            >
              {options.tabBarIcon?.({ focused: isFocused })}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const tabs = [
    { name: "home", icon: "home-variant", label: "Home" },
    { name: "standings", icon: "podium", label: "Standings" },
    { name: "next-race", icon: "flag-checkered", label: "Race" },
    { name: "telemetry", icon: "engine-outline", label: "Data" },
  ] as const;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={tab.icon} label={tab.label} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

// ─── Styles (MD3 only) ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: MD3_SURFACE_CONTAINER,
    elevation: 8,
  },
  tabBar: {
    height: TAB_CONTENT_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  pressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    minWidth: 64,
    position: "relative",
  },
  indicator: {
    position: "absolute",
    top: 2,
    width: 64,
    height: 32,
    backgroundColor: MD3_INDICATOR,
    borderRadius: 16,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 0.5,
  },
});