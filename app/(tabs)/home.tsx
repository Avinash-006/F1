import { useEffect, useState, useRef, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Animated,
  Dimensions,
  ImageBackground,
  ActivityIndicator, // Fixed: Added missing import
} from "react-native";
import { WebView } from "react-native-webview";

// ─────────────────────────────────────────────
// Shared Components
// ─────────────────────────────────────────────
const LiveBadge = memo(() => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={badge.wrap}>
      <Animated.View style={[badge.dot, { opacity: pulse }]} />
      <Text style={badge.text}>LIVE</Text>
    </View>
  );
});

// ─────────────────────────────────────────────
// Main Hub
// ─────────────────────────────────────────────
export default function Home() {
  const [streamOpen, setStreamOpen] = useState(false);

  // JavaScript to trigger fullscreen automatically once video is detected
  const autoFullscreenJS = `
    (function() {
      const tryFullscreen = () => {
        const video = document.querySelector('video');
        if (video) {
          video.play();
          if (video.requestFullscreen) {
            video.requestFullscreen();
          } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
          } else if (video.webkitEnterFullscreen) {
            video.webkitEnterFullscreen();
          }
        } else {
          setTimeout(tryFullscreen, 1000);
        }
      };
      tryFullscreen();
    })();
    true;
  `;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* NAVBAR */}
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>FORMULA ONE</Text>
          <Text style={s.title}>STREAM HUB</Text>
        </View>
        <LiveBadge />
      </View>

      {/* CONTENT AREA */}
      <View style={s.content}>
        {streamOpen ? (
          <View style={s.streamContainer}>
            <WebView
              source={{ uri: "https://f1live.dpdns.org/stream" }}
              style={s.webview}
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              scalesPageToFit
              injectedJavaScript={autoFullscreenJS} // Auto-Fullscreen Logic
              userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
              renderLoading={() => (
                <View style={s.absoluteCenter}>
                  <ActivityIndicator color="#E10600" size="large" />
                  <Text style={s.loadingText}>BUFFERING STREAM...</Text>
                </View>
              )}
            />
            <TouchableOpacity style={s.closeBtn} onPress={() => setStreamOpen(false)}>
              <Text style={s.closeText}>✕  EXIT STREAM</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.previewContainer}>
            <TouchableOpacity 
              style={s.playCard} 
              onPress={() => setStreamOpen(true)} 
              activeOpacity={0.9}
            >
              <ImageBackground
                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/F1.svg/1280px-F1.svg.png' }}
                style={s.playPlaceholder}
                imageStyle={s.logoWatermark}
                resizeMode="contain"
              >
                <View style={s.playBtn}>
                  <Text style={s.playIcon}>▶</Text>
                </View>
                <Text style={s.playLabel}>JOIN LIVE SESSION</Text>
                <Text style={s.playSubText}>f1live.dpdns.org</Text>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {!streamOpen && <View style={s.footerAccent} />}
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const badge = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#E10600", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  text: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "flex-end", 
    paddingHorizontal: 25, 
    paddingTop: 60, 
    paddingBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a"
  },
  eyebrow: { color: "#E10600", fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  title: { color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  
  content: { flex: 1, justifyContent: "center" },
  
  streamContainer: { flex: 1, backgroundColor: "#000" },
  webview: { flex: 1, backgroundColor: "#000" },
  
  closeBtn: { 
    paddingVertical: 18, 
    backgroundColor: "#161616", 
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#333"
  },
  closeText: { color: "#fff", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  
  previewContainer: { paddingHorizontal: 20 },
  playCard: { 
    backgroundColor: "#111", 
    borderRadius: 15, 
    overflow: "hidden", 
    borderWidth: 1, 
    borderColor: "#222",
    height: 250,
  },
  playPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  logoWatermark: { opacity: 0.08, transform: [{ scale: 0.8 }] },
  playBtn: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    backgroundColor: "#E10600", 
    justifyContent: "center", 
    alignItems: "center",
    elevation: 15,
    shadowColor: "#E10600",
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  playIcon: { color: "#fff", fontSize: 28, marginLeft: 5 },
  playLabel: { color: "#fff", marginTop: 20, fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  playSubText: { color: "#444", marginTop: 5, fontSize: 11, fontWeight: "600" },
  
  absoluteCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", backgroundColor: '#000' },
  loadingText: { color: '#444', fontSize: 10, fontWeight: '800', marginTop: 15, letterSpacing: 2 },
  footerAccent: { height: 4, backgroundColor: "#E10600", width: '30%', alignSelf: 'center', marginBottom: 40, borderRadius: 2, opacity: 0.5 }
});