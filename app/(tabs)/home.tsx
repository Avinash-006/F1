import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";

// ─────────────────────────────────────────────
type Driver = {
  position: number;
  code: string;
  name: string;
  team: string;
};

// ─────────────────────────────────────────────
// ✅ TRACK IMAGE (always works)
const getTrackImage = (raceName: string) => {
  return `https://source.unsplash.com/800x400/?formula1,track,${encodeURIComponent(
    raceName
  )}`;
};

// ✅ DRIVER IMAGE (with fallback)
const getDriverImage = (code: string) => {
  return `https://media.formula1.com/image/upload/f_auto/q_auto/v1/fom-website/drivers/${code}`;
};

const FALLBACK_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";

// ─────────────────────────────────────────────
export default function Home() {
  const [raceName, setRaceName] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [status, setStatus] = useState<"LIVE" | "NEXT" | "PAST">("NEXT");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      // 🔴 Try LIVE
      let res = await fetch(
        "https://api.openf1.org/v1/sessions?session_name=Race&order=date_start desc&limit=1"
      );
      let data = await res.json();

      if (data?.length && data[0]?.session_key) {
        const session = data[0];
        setRaceName(session.meeting_name);
        setStatus("LIVE");
        fetchLive(session.session_key);
        return;
      }

      // 🟡 Schedule fallback
      const raceRes = await fetch(
        "https://api.jolpi.ca/ergast/f1/current.json"
      );
      const raceData = await raceRes.json();

      const races = raceData.MRData.RaceTable.Races;
      const now = new Date();

      const nextRace = races.find((r: any) => new Date(r.date) >= now);

      if (nextRace) {
        setRaceName(nextRace.raceName);
        setStatus("NEXT");
      } else {
        const lastRace = races[races.length - 1];
        setRaceName(lastRace.raceName);
        setStatus("PAST");
      }

      // 🟢 Driver standings
      const standRes = await fetch(
        "https://api.jolpi.ca/ergast/f1/current/driverStandings.json"
      );
      const standData = await standRes.json();

      const list = standData.MRData.StandingsTable.StandingsLists[0].DriverStandings.map(
        (d: any) => ({
          position: parseInt(d.position),
          code:
            d.Driver.code ||
            d.Driver.driverId.slice(0, 3).toUpperCase(),
          name: `${d.Driver.givenName} ${d.Driver.familyName}`,
          team: d.Constructors[0].name,
        })
      );

      setDrivers(list);
      setLoading(false);
    } catch (e) {
      console.log("Error:", e);
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // 🔴 LIVE DATA
  const fetchLive = async (sessionKey: number) => {
    try {
      const [driversRes, intervalsRes] = await Promise.all([
        fetch(`https://api.openf1.org/v1/drivers?session_key=${sessionKey}`),
        fetch(`https://api.openf1.org/v1/intervals?session_key=${sessionKey}`),
      ]);

      const driversData = await driversRes.json();
      const intervalsData = await intervalsRes.json();

      const merged: Driver[] = driversData
        .map((d: any) => {
          const interval = intervalsData.find(
            (i: any) => i.driver_number === d.driver_number
          );

          return {
            position: interval?.position ?? 99,
            code: d.name_acronym,
            name: d.full_name,
            team: "",
          };
        })
        .filter((d: { position: number; }) => d.position !== 99)
        .sort((a: { position: number; }, b: { position: number; }) => a.position - b.position);

      setDrivers(merged);
      setLoading(false);
    } catch (e) {
      console.log("Live error:", e);
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.loader}>
        <ActivityIndicator color="#E10600" size="large" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>FORMULA ONE</Text>
          <Text style={s.title}>{raceName}</Text>
        </View>
        <Text style={s.status}>{status}</Text>
      </View>

      {/* TRACK */}
      <Image
        source={{ uri: getTrackImage(raceName) }}
        style={s.track}
      />

      {/* DRIVERS */}
      <FlatList
        data={drivers}
        keyExtractor={(item) => item.position.toString()}
        renderItem={({ item }) => (
          <View style={s.row}>
            <Text style={s.pos}>{item.position}</Text>

            <Image
              source={{ uri: getDriverImage(item.code) }}
              style={s.avatar}
              onError={(e) => {
                e.currentTarget.setNativeProps({
                  src: FALLBACK_AVATAR,
                });
              }}
            />

            <View>
              <Text style={s.code}>{item.code}</Text>
              <Text style={s.name}>{item.name}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

// ─────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  eyebrow: { color: "#E10600", fontSize: 10 },
  title: { color: "#fff", fontSize: 22, fontWeight: "900" },
  status: { color: "#888", fontSize: 12 },

  track: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },

  pos: { color: "#E10600", width: 30 },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#222",
  },

  code: { color: "#fff", fontWeight: "800" },
  name: { color: "#aaa", fontSize: 12 },
});