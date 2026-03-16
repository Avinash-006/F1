import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Animated,
  TouchableOpacity,
} from "react-native";

type Session = { label: string; date?: string; time?: string };
type RaceData = {
  raceName: string;
  round: string;
  season: string;
  date?: string;
  time?: string;
  Circuit: {
    circuitName: string;
    Location: { locality: string; country: string };
  };
  FirstPractice?: { date?: string; time?: string };
  SecondPractice?: { date?: string; time?: string };
  ThirdPractice?: { date?: string; time?: string };
  Sprint?: { date?: string; time?: string };
  SprintQualifying?: { date?: string; time?: string };
  Qualifying?: { date?: string; time?: string };
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Safely handle missing dates/times and force UTC parsing
function getValidDateStr(date?: string, time?: string) {
  if (!date) return ""; // Return empty string so Date parsing fails safely
  const cleanTime = time ? time.replace("Z", "") : "00:00:00";
  return `${date}T${cleanTime}Z`;
}

// Returns "TBC" if date is invalid or missing
function formatDate(date?: string, time?: string) {
  const dateStr = getValidDateStr(date, time);
  if (!dateStr) return "TBC";
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "TBC";

  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function getCountdown(date?: string, time?: string, nowMs: number = Date.now()) {
  const dateStr = getValidDateStr(date, time);
  if (!dateStr) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, isValid: false };

  const target = new Date(dateStr).getTime();
  if (isNaN(target)) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, isValid: false };

  const diff = target - nowMs;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, isValid: true };
  
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  return { days, hours, minutes, seconds, isPast: false, isValid: true };
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.countdownBox}>
      <Text style={styles.countdownValue}>{pad(value)}</Text>
      <Text style={styles.countdownLabel}>{label}</Text>
    </View>
  );
}

export default function SeasonCalendar() {
  const [races, setRaces] = useState<RaceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [expandedRound, setExpandedRound] = useState<string | null>(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Fetch all races for the current season with a high limit to ensure no GPs are cut off
  useEffect(() => {
    fetch("https://api.jolpi.ca/ergast/f1/current.json?limit=100")
      .then((r) => r.json())
      .then((json) => {
        const raceList: RaceData[] = json.MRData.RaceTable.Races;
        setRaces(raceList);
        
        // Auto-expand the next valid upcoming race
        const nextUpcoming = raceList.find((r) => {
          const dateStr = getValidDateStr(r.date, r.time);
          if (!dateStr) return false;
          const t = new Date(dateStr).getTime();
          return !isNaN(t) && t > Date.now();
        });
        
        if (nextUpcoming) {
          setExpandedRound(nextUpcoming.round);
        }
      })
      .catch(() => setError("Failed to load season data."))
      .finally(() => setLoading(false));
  }, []);

  // Global tick every second for all countdowns
  useEffect(() => {
    if (races.length === 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [races]);

  // Pulse animation for live/future indicators
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />
        <ActivityIndicator color="#E10600" size="large" />
        <Text style={styles.loadingText}>LOADING SEASON DATA…</Text>
      </View>
    );
  }

  if (error || races.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />
        <Text style={styles.errorText}>{error || "No races found."}</Text>
      </View>
    );
  }

  const seasonYear = races[0]?.season || new Date().getFullYear();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>F1 CALENDAR</Text>
          <Text style={styles.headerTitle}>SEASON {seasonYear}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {races.map((race) => {
          const isExpanded = expandedRound === race.round;
          const mainCountdown = getCountdown(race.date, race.time, now);
          
          // Determine if this is the immediate next race
          const isNextRace = races.find(r => getCountdown(r.date, r.time, now).isPast === false)?.round === race.round;

          const sessions: Session[] = [
            race.FirstPractice && { label: "FP1", date: race.FirstPractice.date, time: race.FirstPractice.time },
            race.SecondPractice && { label: "FP2", date: race.SecondPractice.date, time: race.SecondPractice.time },
            race.ThirdPractice && { label: "FP3", date: race.ThirdPractice.date, time: race.ThirdPractice.time },
            race.SprintQualifying && { label: "SPRINT QUALI", date: race.SprintQualifying.date, time: race.SprintQualifying.time },
            race.Sprint && { label: "SPRINT", date: race.Sprint.date, time: race.Sprint.time },
            race.Qualifying && { label: "QUALIFYING", date: race.Qualifying.date, time: race.Qualifying.time },
            { label: "RACE", date: race.date, time: race.time },
          ].filter(Boolean) as Session[];

          return (
            <View key={race.round} style={styles.raceWrapper}>
              {/* Clickable Card Header */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setExpandedRound(isExpanded ? null : race.round)}
                style={[styles.raceCard, isExpanded && styles.raceCardExpanded]}
              >
                <View style={[styles.raceCardAccent, mainCountdown.isPast && styles.raceCardAccentPast]} />
                <View style={styles.raceCardBody}>
                  <View style={styles.cardTopRow}>
                    <Text style={[styles.raceName, mainCountdown.isPast && styles.textDimmed]}>
                      {race.raceName.toUpperCase()}
                    </Text>
                    {isNextRace && !isExpanded && mainCountdown.isValid && (
                      <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
                    )}
                  </View>
                  <Text style={styles.raceLocation}>
                    Round {race.round} · {race.Circuit.Location.locality}, {race.Circuit.Location.country}
                  </Text>
                  <Text style={styles.circuitName}>{race.Circuit.circuitName}</Text>
                </View>
              </TouchableOpacity>

              {/* Expanded Content (Countdown + Sessions) */}
              {isExpanded && (
                <View style={styles.expandedContent}>
                  
                  {/* Countdown (Only show if future and date is valid) */}
                  {!mainCountdown.isPast && mainCountdown.isValid && (
                    <View style={styles.countdownRow}>
                      <CountdownBox value={mainCountdown.days} label="DAYS" />
                      <Text style={styles.countdownSep}>:</Text>
                      <CountdownBox value={mainCountdown.hours} label="HRS" />
                      <Text style={styles.countdownSep}>:</Text>
                      <CountdownBox value={mainCountdown.minutes} label="MIN" />
                      <Text style={styles.countdownSep}>:</Text>
                      <CountdownBox value={mainCountdown.seconds} label="SEC" />
                    </View>
                  )}

                  {/* Fallback if date is unconfirmed */}
                  {!mainCountdown.isValid && (
                    <View style={styles.tbcRow}>
                      <Text style={styles.tbcText}>TIMES TO BE CONFIRMED</Text>
                    </View>
                  )}

                  {/* Weekend Schedule */}
                  <Text style={styles.sectionTitle}>WEEKEND SCHEDULE</Text>
                  <View style={styles.sessionList}>
                    {sessions.map((s) => {
                      const dateStr = getValidDateStr(s.date, s.time);
                      const sessionTimeMs = dateStr ? new Date(dateStr).getTime() : NaN;
                      
                      const isValidDate = !isNaN(sessionTimeMs);
                      const isPast = isValidDate && sessionTimeMs < now;
                      const isRace = s.label === "RACE";
                      
                      return (
                        <View
                          key={s.label}
                          style={[
                            styles.sessionRow,
                            isPast && styles.sessionRowPast,
                            isRace && !isPast && styles.sessionRowRace,
                          ]}
                        >
                          <View style={[styles.sessionDot, isRace && styles.sessionDotRace, isPast && styles.sessionDotPast]} />
                          <View style={styles.sessionInfo}>
                            <Text style={[styles.sessionLabel, isRace && styles.sessionLabelRace, isPast && styles.sessionLabelPast]}>
                              {s.label}
                            </Text>
                            <Text style={[styles.sessionDate, isPast && styles.sessionDatePast]}>
                              {formatDate(s.date, s.time)}
                            </Text>
                          </View>
                          {isPast && <Text style={styles.pastTag}>DONE</Text>}
                          {!isPast && isRace && isValidDate && <Text style={styles.raceTag}>MAIN EVENT</Text>}
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  scrollContent: { paddingBottom: 40, paddingTop: 16 },

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
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E10600",
  },

  // Race List & Cards
  raceWrapper: {
    marginBottom: 8,
  },
  raceCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  raceCardExpanded: {
    backgroundColor: "rgba(225,6,0,0.08)",
    borderColor: "rgba(225,6,0,0.2)",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  raceCardAccent: {
    width: 4,
    backgroundColor: "#E10600",
  },
  raceCardAccentPast: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  raceCardBody: {
    flex: 1,
    padding: 18,
    gap: 3,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  raceName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  textDimmed: {
    color: "rgba(255,255,255,0.4)",
  },
  raceLocation: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "600",
  },
  circuitName: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },

  // Expanded View
  expandedContent: {
    marginHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.01)",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "rgba(225,6,0,0.2)",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    paddingBottom: 20,
  },

  // Countdown & TBC
  countdownRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
    gap: 6,
  },
  tbcRow: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  tbcText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
  },
  countdownBox: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 56,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  countdownValue: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },
  countdownLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 2,
  },
  countdownSep: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 12,
  },

  // Schedule
  sectionTitle: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  sessionList: {
    marginHorizontal: 12,
    gap: 2,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 3,
    gap: 12,
  },
  sessionRowPast: {
    opacity: 0.45,
  },
  sessionRowRace: {
    backgroundColor: "rgba(225,6,0,0.07)",
    borderWidth: 1,
    borderColor: "rgba(225,6,0,0.18)",
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  sessionDotRace: {
    backgroundColor: "#E10600",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sessionDotPast: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  sessionInfo: { flex: 1 },
  sessionLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  sessionLabelRace: { color: "#E10600" },
  sessionLabelPast: { color: "rgba(255,255,255,0.5)" },
  sessionDate: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    marginTop: 2,
  },
  sessionDatePast: { color: "rgba(255,255,255,0.25)" },
  pastTag: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  raceTag: {
    color: "#E10600",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

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