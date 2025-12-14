import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../firebase";

type Note = {
  id: string;
  text: string;
};

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (user) initialSync();
  }, [user]);

  const initialSync = async () => {
    try {
      const q = query(
        collection(db, "notes"),
        where("userId", "==", user.uid)
      );

      const snap = await getDocs(q);
      const fetched = snap.docs.map((d) => ({
        id: d.id,
        text: d.data().text,
      }));

      setNotes(fetched);
      await AsyncStorage.setItem("NOTES", JSON.stringify(fetched));
    } catch {
      const saved = await AsyncStorage.getItem("NOTES");
      if (saved) setNotes(JSON.parse(saved));
    }
  };

  const handleAuth = async () => {
    try {
      isSignup
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const addNote = async () => {
    const newNote = {
      id: Date.now().toString(),
      text: "Write something…",
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    await AsyncStorage.setItem("NOTES", JSON.stringify(updated));
    await setDoc(doc(db, "notes", newNote.id), {
      text: newNote.text,
      userId: user.uid,
    });

    setEditingId(newNote.id);
  };

  const updateText = async (id: string, text: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, text } : n
    );
    setNotes(updated);
    await AsyncStorage.setItem("NOTES", JSON.stringify(updated));
    await setDoc(doc(db, "notes", id), {
      text,
      userId: user.uid,
    });
  };

  const deleteNote = async (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    await AsyncStorage.setItem("NOTES", JSON.stringify(updated));
    await deleteDoc(doc(db, "notes", id));
  };

 

  if (!user) {
    return (
      <LinearGradient colors={["#eef2ff", "#f8fafc"]} style={styles.authBg}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>
            {isSignup ? "Create account" : "Welcome back"}
          </Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={handleAuth}>
            <Text style={styles.primaryText}>
              {isSignup ? "Sign up" : "Login"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
            <Text style={styles.switchText}>
              {isSignup ? "Login instead" : "Create new account"}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }



  return (
    <LinearGradient colors={["#f8fafc", "#eef2ff"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notes</Text>
        <TouchableOpacity onPress={() => signOut(auth)}>
          <Ionicons name="log-out-outline" size={22} color="#475569" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View style={styles.noteCard}>
            {editingId === item.id ? (
              <TextInput
                autoFocus
                value={item.text}
                onChangeText={(t) => updateText(item.id, t)}
                onBlur={() => setEditingId(null)}
                style={styles.noteInput}
                underlineColorAndroid="transparent" 
                selectionColor="#6366f1"
                multiline
              />
            ) : (
              <Text style={styles.noteText}>{item.text}</Text>
            )}

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setEditingId(item.id)}>
                <Ionicons name="pencil" size={17} color="#6366f1" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => deleteNote(item.id)}>
                <Ionicons name="trash" size={17} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={addNote}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </LinearGradient>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
  },

  authBg: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },

  authCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 22,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },

  authTitle: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 24,
    color: "#0f172a",
  },

  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    color: "#0f172a",
  },

  primaryBtn: {
    backgroundColor: "#6366f1",
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },

  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  switchText: {
    marginTop: 18,
    textAlign: "center",
    color: "#475569",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
  },

  noteCard: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  noteText: {
    fontSize: 15,
    color: "#0f172a",
    marginBottom: 10,
  },

  noteInput: {
    fontSize: 15,
    color: "#0f172a",
    padding: 0,
    backgroundColor: "transparent",
    marginBottom: 10,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 18,
  },

  fab: {
    position: "absolute",
    bottom: 32,
    right: 32,
    backgroundColor: "#6366f1",
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
