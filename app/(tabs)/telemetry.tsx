import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from "react-native";

const TEAM_COLORS: Record<string, string> = {
  red_bull: "#3671C6",
  ferrari: "#E8002D",
  mercedes: "#00D2BE",
  mclaren: "#FF8000",
  aston_martin: "#358C75",
  alpine: "#FF87BC",
  williams: "#64C4FF",
  rb: "#6692FF",
  visa_cash_app_rb: "#6692FF",
  haas: "#B6BABD",
  sauber: "#52E252",
  kick_sauber: "#52E252",
};

function teamColor(id: string) {
  return TEAM_COLORS[id] ?? "#888";
}

type Result = {
  position: string;
  positionText: string;
  points: string;
  grid: string;
  laps: string;
  status: string;
  Time?: { time: string };
  FastestLap?: {
    rank: string;
    lap: string;
    Time: { time: string };
    AverageSpeed: { speed: string; units: string };
  };
  Driver: {
    driverId: string;
    code: string;
    givenName: string;
    familyName: string;
    nationality: string;
  };
  Constructor: { constructorId: string; name: string };
};

type RaceInfo = {
  raceName: string;
  round: string;
  season: string;
  date: string;
  Circuit: { circuitName: string; Location: { locality: string; country: string } };
  Results: Result[];
};

function positionDelta(result: string, grid: string) {
  const r = parseInt(result);
  const g = parseInt(grid);
  if (isNaN(g) || g === 0) return null;
  return g - r;
}

export default function Telemetry() {
  const [race, setRace] = useState<RaceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("https://api.jolpi.ca/ergast/f1/current/last/results.json")
      .then((r) => r.json())
      .then((json) => {
        const r: RaceInfo = json.MRData.RaceTable.Races[0];
        setRace(r);
      })
      .catch(() => setError("Failed to load race results."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />
        <ActivityIndicator color="#E10600" size="large" />
        <Text style={styles.loadingText}>LOADING TELEMETRY…</Text>
      </View>
    );
  }

  if (error || !race) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />
        <Text style={styles.errorText}>{error || "No data available."}</Text>
      </View>
    );
  }

  const fastestDriver = race.Results.find((r) => r.FastestLap?.rank === "1");
  const winner = race.Results[0];
  const dnfs = race.Results.filter((r) => !r.Time && r.positionText !== "1");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>
            ROUND {race.round} · {race.season} · {race.date}
          </Text>
          <Text style={styles.headerTitle}>TELEMETRY</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerCircuit}>{race.Circuit.Location.country.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Race name */}
        <View style={styles.raceCard}>
          <View style={styles.raceAccent} />
          <View style={styles.raceBody}>
            <Text style={styles.raceName}>{race.raceName.toUpperCase()}</Text>
            <Text style={styles.raceCircuit}>{race.Circuit.circuitName}</Text>
          </View>
        </View>

        {/* Headline stats */}
        <View style={styles.statsRow}>
          {/* Winner */}
          <View style={[styles.statCard, { borderColor: teamColor(winner.Constructor.constructorId) + "55" }]}>
            <Text style={styles.statCardEyebrow}>WINNER</Text>
            <View style={[styles.statColorBar, { backgroundColor: teamColor(winner.Constructor.constructorId) }]} />
            <Text style={styles.statCardCode}>{winner.Driver.code}</Text>
            <Text style={styles.statCardSub}>{winner.Constructor.name}</Text>
            <Text style={styles.statCardDetail}>{winner.Time?.time ?? "—"}</Text>
          </View>

          {/* Fastest Lap */}
          {fastestDriver && (
            <View style={[styles.statCard, { borderColor: "#BC48FF55" }]}>
              <Text style={styles.statCardEyebrow}>FASTEST LAP</Text>
              <View style={[styles.statColorBar, { backgroundColor: "#BC48FF" }]} />
              <Text style={styles.statCardCode}>{fastestDriver.Driver.code}</Text>
              <Text style={styles.statCardSub}>Lap {fastestDriver.FastestLap?.lap}</Text>
              <Text style={styles.statCardDetail}>{fastestDriver.FastestLap?.Time.time}</Text>
            </View>
          )}

          {/* DNFs */}
          <View style={[styles.statCard, { borderColor: "rgba(255,80,80,0.2)" }]}>
            <Text style={styles.statCardEyebrow}>DNF / DNS</Text>
            <View style={[styles.statColorBar, { backgroundColor: "rgba(255,80,80,0.6)" }]} />
            <Text style={[styles.statCardCode, { fontSize: 26 }]}>{dnfs.filter(r => r.status !== "Finished" && !r.status.includes("+")).length}</Text>
            <Text style={styles.statCardSub}>retirements</Text>
            <Text style={styles.statCardDetail}>{race.Results[0].laps} LAPS</Text>
          </View>
        </View>

        {/* Column headers */}
        <View style={styles.tableHeader}>
          <Text style={[styles.colHead, { width: 32 }]}>POS</Text>
          <Text style={[styles.colHead, { width: 44 }]}>CODE</Text>
          <Text style={[styles.colHead, { flex: 1 }]}>DRIVER</Text>
          <Text style={[styles.colHead, { width: 50, textAlign: "right" }]}>GRID</Text>
          <Text style={[styles.colHead, { width: 50, textAlign: "right" }]}>PTS</Text>
          <Text style={[styles.colHead, { width: 90, textAlign: "right" }]}>TIME / STATUS</Text>
        </View>

        {/* Results */}
        <View style={styles.resultsList}>
          {race.Results.map((r, i) => {
            const color = teamColor(r.Constructor.constructorId);
            const delta = positionDelta(r.position, r.grid);
            const isFastest = r.FastestLap?.rank === "1";
            const isFinished = !!r.Time || r.positionText === "1";

            return (
              <View
                key={r.Driver.driverId}
                style={[
                  styles.resultRow,
                  i === 0 && styles.resultRowFirst,
                  !isFinished && styles.resultRowDNF,
                ]}
              >
                {/* Team color strip */}
                <View style={[styles.resultStrip, { backgroundColor: color }]} />

                <View style={styles.resultInner}>
                  <View style={styles.resultMain}>
                    {/* Position */}
                    <Text style={[styles.resultPos, i === 0 && styles.resultPosFirst]}>
                      {r.positionText === "R" ? "R" : r.position}
                    </Text>

                    {/* Driver code */}
                    <Text style={[styles.resultCode, { color }]}>{r.Driver.code}</Text>

                    {/* Name */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName}>
                        {r.Driver.givenName[0]}. {r.Driver.familyName}
                      </Text>
                      <Text style={[styles.resultTeam, { color }]}>{r.Constructor.name}</Text>
                    </View>

                    {/* Grid delta */}
                    <View style={{ width: 50, alignItems: "flex-end" }}>
                      {delta !== null && delta !== 0 ? (
                        <Text style={[styles.delta, delta > 0 ? styles.deltaUp : styles.deltaDown]}>
                          {delta > 0 ? "▲" : "▼"}{Math.abs(delta)}
                        </Text>
                      ) : (
                        <Text style={styles.deltaNeutral}>—</Text>
                      )}
                    </View>

                    {/* Points */}
                    <Text style={[styles.resultPts, { width: 50, textAlign: "right" }]}>
                      {r.points !== "0" ? `+${r.points}` : ""}
                    </Text>

                    {/* Time / Status */}
                    <View style={{ width: 90, alignItems: "flex-end" }}>
                      {isFastest && (
                        <Text style={styles.fastestBadge}>⚡ FL</Text>
                      )}
                      <Text style={[styles.resultTime, !isFinished && styles.resultTimeDNF]} numberOfLines={1}>
                        {r.Time?.time ?? r.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerEyebrow: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerRight: { alignItems: "flex-end" },
  headerCircuit: {
    color: "#E10600",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
  },

  // Race card
  raceCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: "rgba(225,6,0,0.07)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(225,6,0,0.15)",
    overflow: "hidden",
  },
  raceAccent: { width: 4, backgroundColor: "#E10600" },
  raceBody: { flex: 1, padding: 14, gap: 3 },
  raceName: { color: "#fff", fontSize: 15, fontWeight: "900", letterSpacing: 0.5 },
  raceCircuit: { color: "rgba(255,255,255,0.4)", fontSize: 11 },

  // Stat cards
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 4,
    borderWidth: 1,
    padding: 12,
    gap: 3,
    overflow: "hidden",
  },
  statColorBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  statCardEyebrow: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 6,
  },
  statCardCode: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  statCardSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "600",
  },
  statCardDetail: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },

  // Table header
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    marginBottom: 4,
  },
  colHead: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  // Results
  resultsList: { paddingHorizontal: 8, paddingTop: 4, gap: 2 },
  resultRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  resultRowFirst: {
    backgroundColor: "rgba(225,6,0,0.07)",
    borderColor: "rgba(225,6,0,0.18)",
  },
  resultRowDNF: { opacity: 0.55 },
  resultStrip: { width: 3 },
  resultInner: { flex: 1, paddingHorizontal: 8, paddingVertical: 10 },
  resultMain: { flexDirection: "row", alignItems: "center" },

  resultPos: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 13,
    fontWeight: "900",
    width: 32,
  },
  resultPosFirst: { color: "#E10600" },
  resultCode: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    width: 44,
  },
  resultName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  resultTeam: {
    fontSize: 9,
    fontWeight: "600",
    marginTop: 1,
  },
  delta: {
    fontSize: 10,
    fontWeight: "800",
  },
  deltaUp: { color: "#4ade80" },
  deltaDown: { color: "#f87171" },
  deltaNeutral: { color: "rgba(255,255,255,0.2)", fontSize: 10 },
  resultPts: {
    color: "#E10600",
    fontSize: 11,
    fontWeight: "800",
  },
  fastestBadge: {
    color: "#BC48FF",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  resultTime: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "right",
  },
  resultTimeDNF: { color: "rgba(255,80,80,0.6)" },

  loadingText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
  },
  errorText: {
    color: "rgba(255,80,80,0.8)",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});