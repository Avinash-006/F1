import { useRef, useEffect, useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  // ── Reactive dimensions so layout & video reflow on rotation
  const [dims, setDims] = useState(() => Dimensions.get("window"));
  useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ window }) => {
      setDims(window);
    });
    return () => sub.remove();
  }, []);
  const { width, height } = dims;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(20)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const player = useVideoPlayer(require("../assets/videos/intro.mp4"), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    const subscription = player.addListener("playToEnd", () => {
      player.replay();
    });
    return () => subscription.remove();
  }, [player]);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300),
      Animated.timing(badgeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(550),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 650, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(1000),
      Animated.parallel([
        Animated.timing(buttonOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(buttonSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handlePressIn = () =>
    Animated.spring(buttonScale, { toValue: 0.96, friction: 5, useNativeDriver: true }).start();

  const handlePressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Video — reactive width/height ensures it covers correctly on rotation */}
      <VideoView
        player={player}
        style={[styles.video, { width, height }]}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Base overlay */}
      <View style={styles.overlay} />

      {/* Bottom vignette — only behind button area, height is reactive */}
      <View style={[styles.vignette, { height: height * 0.28 }]} />

      {/* ── TOP ROW: badge + checkered corner */}
      <View style={styles.topRow}>
        <Animated.View style={[styles.topBadge, { opacity: badgeAnim }]}>
          <View style={styles.liveDot} />
          <Text style={styles.topBadgeText}>FORMULA ONE · 2026</Text>
        </Animated.View>

        <View style={styles.checkered}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={styles.checkRow}>
              {[...Array(5)].map((_, j) => (
                <View
                  key={j}
                  style={[
                    styles.checkCell,
                    (i + j) % 2 === 0 ? styles.checkWhite : styles.checkBlack,
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* ── TITLE: sits in the upper-centre, well clear of the button */}
      <Animated.View
        style={[
          styles.titleBlock,
          { top: height * 0.32, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.eyebrow}>WELCOME TO</Text>
        <Text style={styles.titleF}>FORMULA</Text>
        <View style={styles.titleNumRow}>
          <View style={styles.outlineBox}>
            <Text style={styles.outlineText}>1</Text>
          </View>
          <View style={styles.redBar} />
        </View>
        <Text style={styles.tagline}>
          Lights out. The world's fastest{"\n"}motorsport at your fingertips.
        </Text>
      </Animated.View>

      {/* ── BOTTOM: divider + button + footer — pinned to bottom */}
      <View style={styles.bottomBlock}>
        <Animated.View style={[styles.dividerRow, { opacity: fadeAnim }]}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>›› RACE STARTS NOW ‹‹</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        <Animated.View
          style={{
            opacity: buttonOpacity,
            transform: [{ translateY: buttonSlide }, { scale: buttonScale }],
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/home")}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            style={styles.button}
          >
            <View style={styles.buttonAccent} />
            <Text style={styles.buttonText}>CONTINUE</Text>
            <View style={styles.buttonArrowWrap}>
              <Text style={styles.buttonArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ opacity: buttonOpacity }}>
          <Text style={styles.footer}>
            By continuing you agree to our{" "}
            <Text style={styles.footerLink}>Terms & Conditions</Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  vignette: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(8,0,0,0.55)",
  },

  // Top row — absolutely positioned so it never participates in flow
  topRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 56,
  },
  topBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E10600",
  },
  topBadgeText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.5,
  },
  checkered: { opacity: 0.4 },
  checkRow: { flexDirection: "row" },
  checkCell: { width: 9, height: 9 },
  checkWhite: { backgroundColor: "#fff" },
  checkBlack: { backgroundColor: "#000" },

  // Title — absolutely positioned, top set reactively in JSX
  titleBlock: {
    position: "absolute",
    left: 28,
    right: 28,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    letterSpacing: 5,
    fontWeight: "700",
    marginBottom: 6,
  },
  titleF: {
    color: "#FFFFFF",
    fontSize: 76,
    fontWeight: "900",
    letterSpacing: -3,
    lineHeight: 76,
  },
  titleNumRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 2,
    marginBottom: 20,
  },
  outlineBox: {
    borderWidth: 3,
    borderColor: "#E10600",
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  outlineText: {
    color: "#FFFFFF",
    fontSize: 76,
    fontWeight: "900",
    lineHeight: 84,
    letterSpacing: -3,
  },
  redBar: {
    height: 5,
    flex: 1,
    maxWidth: 90,
    backgroundColor: "#E10600",
  },
  tagline: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14.5,
    lineHeight: 23,
    letterSpacing: 0.2,
  },

  // Bottom block — pinned to bottom, clear of title
  bottomBlock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  dividerLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: "700",
  },

  // Button
  button: {
    backgroundColor: "#E10600",
    borderRadius: 2,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 18,
    elevation: 16,
    shadowColor: "#E10600",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
  },
  buttonAccent: {
    width: 6,
    alignSelf: "stretch",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  buttonText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 6,
    textAlign: "center",
    paddingVertical: 19,
  },
  buttonArrowWrap: {
    paddingHorizontal: 20,
    paddingVertical: 19,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  buttonArrow: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "300",
  },

  // Footer
  footer: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 0.4,
  },
  footerLink: {
    color: "rgba(255,255,255,0.5)",
    textDecorationLine: "underline",
  },
});