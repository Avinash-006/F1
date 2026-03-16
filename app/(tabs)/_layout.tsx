import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Platform, Animated, Pressable, Easing } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef, useEffect, memo } from "react";

type TabIconProps = {
  focused: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
};

const TabIcon = memo(({ focused, icon, label }: TabIconProps) => {
  const animated = useRef({
    scale: new Animated.Value(1),
    translateY: new Animated.Value(0),
    opacity: new Animated.Value(0.5),
  }).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(animated.scale, {
        toValue: focused ? 1.2 : 1,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(animated.translateY, {
        toValue: focused ? -2 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animated.opacity, {
        toValue: focused ? 1 : 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <View style={styles.tabItem}>
      <Animated.View style={{ 
        transform: [{ scale: animated.scale }, { translateY: animated.translateY }],
        opacity: animated.opacity
      }}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={focused ? "#E10600" : "#888"}
          style={focused ? styles.activeGlow : null}
        />
      </Animated.View>
      <Animated.Text style={[
        styles.tabLabel, 
        { color: focused ? "#fff" : "#888", opacity: animated.opacity }
      ]}>
        {label}
      </Animated.Text>
    </View>
  );
});

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBarContainer}>
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
              style={styles.tabPressable}
            >
              {options.tabBarIcon?.({ focused: isFocused })}
              {isFocused && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

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

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: "#0d0d0d", // Match your app background
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingBottom: Platform.OS === "ios" ? 30 : 10, // Handle safe area
    height: Platform.OS === "ios" ? 90 : 70,
  },
  tabBar: {
    flexDirection: "row",
    height: "100%",
    alignItems: "center",
  },
  tabPressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 3,
    backgroundColor: '#E10600',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  activeGlow: {
    textShadowColor: "rgba(225, 6, 0, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});