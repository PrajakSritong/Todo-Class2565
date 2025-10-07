import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import LoginScreen from "./LoginScreen";
import ProfileScreen from "./ProfileScreen";
import MembersScreen from "./MembersScreen";
import StatusScreen from "./StatusScreen.js";

const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: "#007AFF" },
          headerTintColor: "#fff",
          tabBarActiveTintColor: "#007AFF",
          tabBarInactiveTintColor: "#888",
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopWidth: 0.5,
            borderTopColor: "#ddd",
            height: 60,
            paddingBottom: 5,
          },
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === "Members") {
              iconName = "people-outline";
            } else if (route.name === "Status") {
              iconName = "create-outline";
            } else if (route.name === "Profile") {
              iconName = "person-circle-outline";
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Members"
          options={{ title: "สมาชิกตามปี" }}
          children={() => <MembersScreen user={user} />}
        />
        <Tab.Screen
          name="Status"
          options={{ title: "โพสต์สถานะ" }}
          children={() => <StatusScreen user={user} />}
        />
        <Tab.Screen
          name="Profile"
          options={{ title: "โปรไฟล์" }}
          children={() => <ProfileScreen user={user} />}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
