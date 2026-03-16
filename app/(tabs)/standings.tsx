import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { MotiView, AnimatePresence } from "moti";

const { width } = Dimensions.get("window");

// ── Team Data Maps ──
const TEAM_COLORS: Record<string, string> = {
  red_bull: "3671C6", ferrari: "E8002D", mercedes: "00D2BE",
  mclaren: "FF8000", aston_martin: "358C75", alpine: "FF87BC",
  williams: "64C4FF", rb: "6692FF", visa_cash_app_rb: "6692FF",
  haas: "B6BABD", sauber: "52E252", kick_sauber: "52E252",
};

const TEAM_LOGOS: Record<string, string> = {
  red_bull: "https://media.formula1.com/content/dam/fom-website/teams/2024/red-bull-racing-logo.png",
  ferrari: "https://media.formula1.com/content/dam/fom-website/teams/2024/ferrari-logo.png",
  mercedes: "https://media.formula1.com/content/dam/fom-website/teams/2024/mercedes-logo.png",
  mclaren: "https://media.formula1.com/content/dam/fom-website/teams/2024/mclaren-logo.png",
  aston_martin: "https://media.formula1.com/content/dam/fom-website/teams/2024/aston-martin-logo.png",
  alpine: "https://media.formula1.com/content/dam/fom-website/teams/2024/alpine-logo.png",
  williams: "https://media.formula1.com/content/dam/fom-website/teams/2024/williams-logo.png",
  rb: "https://media.formula1.com/content/dam/fom-website/teams/2024/rb-logo.png",
  visa_cash_app_rb: "https://media.formula1.com/content/dam/fom-website/teams/2024/rb-logo.png",
  haas: "https://media.formula1.com/content/dam/fom-website/teams/2024/haas-logo.png",
  sauber: "https://media.formula1.com/content/dam/fom-website/teams/2024/kick-sauber-logo.png",
  kick_sauber: "https://media.formula1.com/content/dam/fom-website/teams/2024/kick-sauber-logo.png",
};

const teamColor = (id: string) => `#${TEAM_COLORS[id] ?? "888888"}`;
const normalizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// ── Types ──
type DriverStanding = {
  position: string; points: string; wins: string;
  Driver: { driverId: string; givenName: string; familyName: string };
  Constructors: { constructorId: string; name: string }[];
};

type ConstructorStanding = {
  position: string; points: string; wins: string;
  Constructor: { constructorId: string; name: string; nationality: string };
};

export default function Standings() {
  const [tab, setTab] = useState<"drivers" | "constructors">("drivers");
  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [constructors, setConstructors] = useState<ConstructorStanding[]>([]);
  const [driverFaces, setDriverFaces] = useState<Record<string, string>>({});
  const [seasonYear, setSeasonYear] = useState<string>("CURRENT");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dRes, cRes, imgRes] = await Promise.all([
          fetch("https://api.jolpi.ca/ergast/f1/current/driverStandings.json"),
          fetch("https://api.jolpi.ca/ergast/f1/current/constructorStandings.json"),
          fetch("https://api.openf1.org/v1/drivers?session_key=latest"),
        ]);
        
        const dJson = await dRes.json();
        const cJson = await cRes.json();
        const imgJson = await imgRes.json();

        const faceMap: Record<string, string> = {};
        if (Array.isArray(imgJson)) {
          imgJson.forEach((drv) => {
            if (drv.last_name && drv.headshot_url) faceMap[normalizeStr(drv.last_name)] = drv.headshot_url;
          });
        }
        
        setSeasonYear(dJson.MRData.StandingsTable.season);
        setDrivers(dJson.MRData.StandingsTable.StandingsLists[0].DriverStandings);
        setConstructors(cJson.MRData.StandingsTable.StandingsLists[0].ConstructorStandings);
        setDriverFaces(faceMap);
      } catch (e) {
        console.error("Failed to fetch F1 data:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />
      
      {/* Header Area */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>SEASON {seasonYear}</Text>
        <Text style={styles.headerTitle}>Championship</Text>
      </View>

      {/* Snappy Tab Switcher */}
      <View style={styles.tabWrapper}>
        <View style={styles.tabBackground}>
          <MotiView
            animate={{ translateX: tab === "drivers" ? 0 : (width - 48 - 8) / 2 }}
            transition={{ type: "timing", duration: 150 }} // Faster, linear slide instead of spring
            style={styles.tabIndicator}
          />
          <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => setTab("drivers")}>
            <Text style={[styles.tabText, tab === "drivers" && styles.tabTextActive]}>Drivers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => setTab("constructors")}>
            <Text style={[styles.tabText, tab === "constructors" && styles.tabTextActive]}>Teams</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#E10600" size="large" />
          <Text style={styles.loadingText}>Loading timing data...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
          {/* Fades the entire list as one block instead of individual items */}
          <AnimatePresence exitBeforeEnter>
            <MotiView
              key={tab}
              from={{ opacity: 0, translateY: 5 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "timing", duration: 150 }}
              style={{ paddingBottom: 60 }} // Replaced the empty padding View
            >
              {tab === "drivers" ? (
                drivers.map((d, i) => (
                  <DriverItem 
                    key={d.Driver.driverId} 
                    item={d} 
                    face={driverFaces[normalizeStr(d.Driver.familyName)]} 
                  />
                ))
              ) : (
                constructors.map((c, i) => (
                  <TeamItem key={c.Constructor.constructorId} item={c} />
                ))
              )}
            </MotiView>
          </AnimatePresence>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Optimized List Items (Standard Views) ──

const DriverItem = ({ item, face }: { item: DriverStanding, face?: string }) => {
  const color = teamColor(item.Constructors[0].constructorId);
  const avatarFallback = `https://ui-avatars.com/api/?name=${item.Driver.givenName}+${item.Driver.familyName}&background=27272A&color=fff&bold=true`;

  return (
    <View style={styles.row}>
      <View style={[styles.teamAccent, { backgroundColor: color }]} />
      <Text style={styles.rowPos}>{item.position}</Text>
      
      <View style={[styles.avatarRing, { borderColor: color }]}>
        <Image source={{ uri: face || avatarFallback }} style={styles.avatar} />
      </View>

      <View style={styles.rowNameWrap}>
        <Text style={styles.rowFirstName}>{item.Driver.givenName}</Text>
        <Text style={styles.rowLastName}>{item.Driver.familyName.toUpperCase()}</Text>
      </View>

      <View style={styles.rowPointsWrap}>
        <Text style={styles.rowPoints}>{item.points}</Text>
        <Text style={styles.rowPtsLabel}>PTS</Text>
      </View>
    </View>
  );
};

const TeamItem = ({ item }: { item: ConstructorStanding }) => {
  const color = teamColor(item.Constructor.constructorId);
  const logo = TEAM_LOGOS[item.Constructor.constructorId] || "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/F1.svg/200px-F1.svg.png";
  
  return (
    <View style={styles.row}>
      <View style={[styles.teamAccent, { backgroundColor: color }]} />
      <Text style={styles.rowPos}>{item.position}</Text>
      
      <View style={[styles.avatarRing, { borderColor: color }]}>
        <View style={styles.logoContainer}>
          <Image source={{ uri: logo }} style={styles.teamLogo} resizeMode="contain" />
        </View>
      </View>

      <View style={styles.rowNameWrap}>
        <Text style={styles.rowLastName}>{item.Constructor.name.toUpperCase()}</Text>
        <Text style={styles.rowFirstName}>{item.Constructor.nationality}</Text>
      </View>

      <View style={styles.rowPointsWrap}>
        <Text style={styles.rowPoints}>{item.points}</Text>
        <Text style={styles.rowPtsLabel}>PTS</Text>
      </View>
    </View>
  );
};

// ── Styles ──
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090B" },
  
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  headerEyebrow: { color: "#E10600", fontSize: 13, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase" },
  headerTitle: { color: "#FAFAFA", fontSize: 36, fontWeight: "900", marginTop: 2, letterSpacing: -0.5 },
  
  // Tab Switcher
  tabWrapper: { paddingHorizontal: 24, marginBottom: 20 },
  tabBackground: { 
    flexDirection: "row", 
    backgroundColor: "#18181B", 
    borderRadius: 16, 
    height: 52, 
    padding: 4,
    borderWidth: 1,
    borderColor: "#27272A"
  },
  tabIndicator: {
    position: "absolute",
    backgroundColor: "#27272A", 
    width: (width - 48 - 8) / 2, 
    height: 42,
    borderRadius: 12,
    top: 4,
    left: 4,
  },
  tabItem: { flex: 1, justifyContent: "center", alignItems: "center", zIndex: 1 },
  tabText: { color: "#A1A1AA", fontWeight: "600", fontSize: 15 },
  tabTextActive: { color: "#FAFAFA", fontWeight: "700" },

  // Main List
  scrollList: { paddingHorizontal: 20, paddingTop: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderWidth: 1,
    borderColor: "#27272A", 
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  
  teamAccent: { width: 4, height: 28, borderRadius: 2, marginRight: 16 },
  rowPos: { color: "#FAFAFA", fontSize: 20, fontWeight: "900", width: 28, textAlign: "left", marginRight: 8 },
  
  // Avatars & Logos
  avatarRing: {
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    borderWidth: 2, 
    padding: 2, 
    justifyContent: "center", 
    alignItems: "center",
    marginRight: 16
  },
  avatar: { width: "100%", height: "100%", borderRadius: 20, backgroundColor: "#27272A" },
  logoContainer: { width: "100%", height: "100%", borderRadius: 20, backgroundColor: "#FFF", justifyContent: "center", alignItems: "center", padding: 4 },
  teamLogo: { width: "100%", height: "100%" },
  
  // Typography inside rows
  rowNameWrap: { flex: 1, justifyContent: "center" },
  rowFirstName: { color: "#A1A1AA", fontSize: 13, fontWeight: "500", marginBottom: 2 },
  rowLastName: { color: "#FAFAFA", fontSize: 17, fontWeight: "800", letterSpacing: 0.2 },
  
  rowPointsWrap: { alignItems: "flex-end", justifyContent: "center" },
  rowPoints: { color: "#FAFAFA", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  rowPtsLabel: { color: "#71717A", fontSize: 11, fontWeight: "800", marginTop: -2 },
  
  // Utils
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#A1A1AA", fontSize: 14, fontWeight: "600", marginTop: 16 },
});