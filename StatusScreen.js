import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Modal,
  Button,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

const API_KEY = Constants.expoConfig.extra.API_KEY;
const BASE_URL = "https://cis.kku.ac.th";
const DEFAULT_AVATAR = "https://www.w3schools.com/howto/img_avatar.png";

export default function StatusScreen({ user }) {
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});

  // โหลด token จาก AsyncStorage
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        if (storedToken) setToken(storedToken);
      } catch (e) {
        console.error("Error loading token:", e);
      }
    };
    loadToken();
  }, []);

  // Fetch posts
  const fetchPosts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/classroom/status`, {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-api-key": API_KEY,
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      const serverPosts = data.data ? (Array.isArray(data.data) ? data.data : [data.data]) : [];

      // ปรับ hasLiked และ image
      const mergedPosts = serverPosts.map((sp) => {
        const userLiked =
          sp.like?.some((l) =>
            typeof l === "object" ? l.email === user.email : l === user._id
          ) || false;

        const createdByImage =
          sp.createdBy?.image?.startsWith("http")
            ? sp.createdBy.image
            : sp.createdBy?.image
            ? `${BASE_URL}${sp.createdBy.image}`
            : DEFAULT_AVATAR;

        return { ...sp, hasLiked: userLiked, createdBy: { ...sp.createdBy, image: createdByImage } };
      });

      // แก้ไข comment images
      mergedPosts.forEach((p) => {
        p.comment = (p.comment || []).map((c) => {
          const avatarUrl =
            c.createdBy?.image?.startsWith("http")
              ? c.createdBy.image
              : c.createdBy?.image
              ? `${BASE_URL}${c.createdBy.image}`
              : DEFAULT_AVATAR;
          return { ...c, createdBy: { ...c.createdBy, image: avatarUrl } };
        });
      });

      setPosts(mergedPosts);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

useFocusEffect(
  React.useCallback(() => {
    const fetchData = async () => {
      await fetchPosts();
    };
    fetchData();
  }, [token, user])
);


  // Post status
  const handlePost = async () => {
    if (!status.trim() || !token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/classroom/status`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "x-api-key": API_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: status }),
      });
      const data = await res.json();
      if (data && data.data) {
        const postedBy = data.data.createdBy;
        const avatarUrl = postedBy?.image?.startsWith("http")
          ? postedBy.image
          : postedBy?.image
          ? `${BASE_URL}${postedBy.image}`
          : DEFAULT_AVATAR;

        const newPost = {
          ...data.data,
          createdBy: { ...postedBy, image: avatarUrl },
          comment: [],
          like: [],
          hasLiked: false,
        };

        setPosts([newPost, ...posts]);
        setStatus("");
        setModalVisible(false);
      }
    } catch (err) {
      console.error("Error posting status:", err);
    }
  };

  // Toggle like
  const toggleLike = async (postId, hasLiked) => {
    if (!token) return;
    const postIndex = posts.findIndex((p) => p._id === postId);
    if (postIndex === -1) return;
    const newPosts = [...posts];
    const post = newPosts[postIndex];

    try {
      if (!hasLiked) {
        await fetch(`${BASE_URL}/api/classroom/like`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "x-api-key": API_KEY,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ statusId: postId }),
        });
        post.hasLiked = true;
        post.like = [...(post.like || []), user._id];
      } else {
        await fetch(`${BASE_URL}/api/classroom/like`, {
          method: "DELETE",
          headers: {
            accept: "application/json",
            "x-api-key": API_KEY,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ statusId: postId }),
        });
        post.hasLiked = false;
        post.like = (post.like || []).filter((l) => l !== user._id);
      }
      setPosts(newPosts);
    } catch (err) {
      console.error("Like/Unlike error:", err);
    }
  };

  // Add comment
  const addComment = async (postId) => {
    if (!token) return;
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const postIndex = posts.findIndex((p) => p._id === postId);
    if (postIndex === -1) return;

    const newPosts = [...posts];
    const newComment = {
      _id: Date.now().toString(),
      content: text,
      createdBy: {
        email: user.email,
        image:
          user.image?.startsWith("http")
            ? user.image
            : user.image
            ? `${BASE_URL}${user.image}`
            : DEFAULT_AVATAR,
      },
      createdAt: new Date().toISOString(),
    };

    try {
      await fetch(`${BASE_URL}/api/classroom/comment`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "x-api-key": API_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: text, statusId: postId }),
      });

      newPosts[postIndex].comment = [
        ...(newPosts[postIndex].comment || []),
        newComment,
      ];
      setPosts(newPosts);
      setCommentInputs({ ...commentInputs, [postId]: "" });
    } catch (err) {
      console.error("Add comment error:", err);
    }
  };

  // Delete post
  const deletePost = async (postId) => {
    if (!token) return;
    const postIndex = posts.findIndex((p) => p._id === postId);
    if (postIndex === -1) return;

    try {
      const res = await fetch(`${BASE_URL}/api/classroom/status/${postId}`, {
        method: "DELETE",
        headers: {
          accept: "application/json",
          "x-api-key": API_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        setPosts(posts.filter((p) => p._id !== postId));
      } else {
        console.error("Failed to delete post:", res.status);
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1877f2" />
        <Text style={{ marginTop: 8, color: "#555" }}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>News Feed</Text>

      <FlatList
        style={{ marginTop: 16 }}
        data={posts}
        keyExtractor={(post) => post._id}
        renderItem={({ item }) => {
          const likeCount = item.like ? item.like.length : 0;

          return (
            <View style={styles.card}>
              {/* Header */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <Image
                  source={{ uri: item.createdBy?.image || DEFAULT_AVATAR }}
                  style={styles.avatar}
                />
                <View>
                  <Text style={styles.author}>{item.createdBy?.email || "User"}</Text>
                  <Text style={styles.time}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Content */}
              <Text style={styles.content}>{item.content}</Text>

              {/* Actions */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => toggleLike(item._id, item.hasLiked)}
                  style={{ flexDirection: "row", alignItems: "center", marginRight: 15 }}
                >
                  <Ionicons
                    name={item.hasLiked ? "heart" : "heart-outline"}
                    size={20}
                    color={item.hasLiked ? "red" : "#555"}
                  />
                  <Text style={{ marginLeft: 4, color: "#555" }}>
                    {likeCount} {likeCount === 1 ? "like" : "likes"}
                  </Text>
                </TouchableOpacity>

                {item.createdBy?._id === user._id && (
                  <TouchableOpacity onPress={() => deletePost(item._id)}>
                    <Ionicons name="trash" size={20} color="red" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Comments */}
              {item.comment?.map((c) => (
                <View key={c._id} style={styles.comment}>
                  <Image source={{ uri: c.createdBy?.image || DEFAULT_AVATAR }} style={styles.commentAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentAuthor}>{c.createdBy?.email || "User"}</Text>
                    <Text style={styles.commentContent}>{c.content}</Text>
                  </View>
                </View>
              ))}

              {/* Add Comment */}
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Write a comment..."
                  value={commentInputs[item._id] || ""}
                  onChangeText={(text) =>
                    setCommentInputs({ ...commentInputs, [item._id]: text })
                  }
                />
                <Button title="Send" onPress={() => addComment(item._id)} />
              </View>
            </View>
          );
        }}
      />

      {/* Floating Add Post Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: "600", marginBottom: 8 }}>New Post</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Write your post..."
              multiline
              value={status}
              onChangeText={setStatus}
            />
            <Button title="Post" onPress={handlePost} />
            <Button
              title="Cancel"
              color="red"
              onPress={() => setModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5", padding: 10 },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center", marginVertical: 10, color: "#1877f2" },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 8 },
  author: { fontWeight: "600", fontSize: 14, color: "#333" },
  time: { fontSize: 11, color: "#555" },
  content: { fontSize: 14, color: "#111", marginVertical: 6 },
  cardActions: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  comment: { flexDirection: "row", alignItems: "flex-start", marginTop: 6 },
  commentAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 6 },
  commentAuthor: { fontWeight: "600", fontSize: 12, color: "#222" },
  commentContent: { fontSize: 12, color: "#333" },
  commentInputContainer: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 20, padding: 6, marginRight: 6, backgroundColor: "#f0f2f5", fontSize: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { width: "90%", backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1877f2",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
