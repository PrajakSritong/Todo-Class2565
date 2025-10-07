import React, { useState, useCallback } from "react";
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

const DEFAULT_AVATAR = "https://www.w3schools.com/howto/img_avatar.png";
const BASE_URL = "https://cis.kku.ac.th";
const API_KEY = Constants.expoConfig.extra.API_KEY;

export default function MembersScreen() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const loadToken = async () => {
    const t = await AsyncStorage.getItem("token");
    setToken(t);
  };

  useFocusEffect(
    useCallback(() => {
      loadToken();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (!token) return;

      const fetchMembers = async () => {
        setLoading(true);
        try {
          const res = await fetch(`${BASE_URL}/api/classroom/class/2565`, {
            method: "GET",
            headers: {
              accept: "application/json",
              "x-api-key": API_KEY,
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await res.json();
          console.log("Members API response:", data); // <-- debug

          if (data?.data) {
            setMembers(Array.isArray(data.data) ? data.data : [data.data]);
          } else {
            setMembers([]);
          }
        } catch (err) {
          console.error("Error fetching members:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchMembers();
    }, [token])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 8 }}>Loading members...</Text>
      </View>
    );
  }

  if (!members.length) {
    return (
      <View style={styles.center}>
        <Text>ไม่พบสมาชิก</Text>
      </View>
    );
  }
    return (
  <SafeAreaView style={styles.container}>
    {/* หัวข้อพร้อมจำนวนสมาชิก */}
    <Text style={styles.title}>
      สมาชิก ปี 2565 ({members.length})
    </Text>

    <FlatList
      data={members}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Image
            source={{
              uri: item.image?.startsWith("http")
                ? item.image
                : item.image
                ? `${BASE_URL}${item.image}`
                : DEFAULT_AVATAR,
            }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.name}>{item.firstname} {item.lastname}</Text>
            <Text style={styles.email}>{item.email}</Text>
          </View>
        </View>
      )}
    />
  </SafeAreaView>
);

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f4f7", padding: 16 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 16, textAlign: "center", color: "#333" },
  card: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  name: { fontSize: 16, fontWeight: "500", color: "#222" },
  email: { fontSize: 14, color: "#555" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});

