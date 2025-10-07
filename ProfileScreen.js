import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const API_KEY = Constants.expoConfig.extra.API_KEY;

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const fetchProfile = async (userToken) => {
    setLoading(true);
    try {
      const response = await fetch("https://cis.kku.ac.th/api/classroom/profile", {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-api-key": API_KEY,
          Authorization: `Bearer ${userToken}`,
        },
      });
      const result = await response.json();
      setProfile(result.data);
    } catch (e) {
      console.error("Fetch Profile Error:", e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadTokenAndProfile = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        if (storedToken) {
          setToken(storedToken);
          fetchProfile(storedToken);
        } else {
          setLoading(false);
          setProfile(null);
        }
      } catch (e) {
        console.error("Error loading token:", e);
        setLoading(false);
      }
    };
    loadTokenAndProfile();
  }, []);

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1 }} />
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={styles.error}>ไม่สามารถโหลดข้อมูลโปรไฟล์ได้</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Image
            source={{
              uri: profile.image.startsWith("http")
                ? profile.image
                : `https://cis.kku.ac.th${profile.image}`,
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>
            {profile.firstname} {profile.lastname}
          </Text>
          <Text style={styles.email}>{profile.email}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ข้อมูลทั่วไป</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Role:</Text>
            <Text style={styles.value}>{profile.role}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>สถานะยืนยัน:</Text>
            <Text style={styles.value}>
              {profile.confirmed ? "✅ ยืนยันแล้ว" : "❌ ยังไม่ยืนยัน"}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ข้อมูลการศึกษา</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Major:</Text>
            <Text style={styles.value}>{profile.education?.major || "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Student ID:</Text>
            <Text style={styles.value}>{profile.education?.studentId || "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>ปีที่เข้าศึกษา:</Text>
            <Text style={styles.value}>
              {profile.education?.enrollmentYear || "-"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles เหมือนเดิม ---


// --- Styles เหมือนเดิม ---


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f6f9",
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    marginBottom: 5,
  },
  email: {
    fontSize: 15,
    color: "#666",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: "#007AFF",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#444",
  },
  value: {
    fontSize: 14,
    color: "#333",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
