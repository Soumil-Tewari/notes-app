import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
      loadLocal();
    }
  };

  const loadLocal = async () => {
    const saved = await AsyncStorage.getItem("NOTES");
    if (saved) setNotes(JSON.parse(saved));
  };

  const handleAuth = async () => {
    try {
      isSignup
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);

      setEmail("");
      setPassword("");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setNotes([]);
  };

  const persistLocal = async (updated: Note[]) => {
    setNotes(updated);
    await AsyncStorage.setItem("NOTES", JSON.stringify(updated));
  };

  const syncNote = async (note: Note) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "notes", note.id), {
        text: note.text,
        userId: user.uid,
      });
    } catch {}
  };

  const deleteFromCloud = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notes", id));
    } catch {}
  };

  const addNote = async () => {
    const newNote = {
      id: Date.now().toString(),
      text: "New note",
    };
    const updated = [newNote, ...notes];
    await persistLocal(updated);
    await syncNote(newNote);
    setEditingId(newNote.id);
  };

  const updateText = async (id: string, text: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, text } : n
    );
    await persistLocal(updated);
    await syncNote(updated.find((n) => n.id === id)!);
  };

  const deleteNote = async (id: string) => {
    await persistLocal(notes.filter((n) => n.id !== id));
    await deleteFromCloud(id);
  };

  if (!user) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>
          {isSignup ? "Create Account" : "Welcome Back"}
        </Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleAuth}>
          <Text style={styles.primaryText}>
            {isSignup ? "Sign Up" : "Login"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
          <Text style={styles.switchText}>
            {isSignup ? "Login instead" : "Create an account"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Notes</Text>
        <TouchableOpacity onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color="#444" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={styles.noteCard}>
            {editingId === item.id ? (
              <TextInput
                value={item.text}
                autoFocus
                onChangeText={(t) => updateText(item.id, t)}
                onBlur={() => setEditingId(null)}
                style={styles.noteInput}
              />
            ) : (
              <Text style={styles.noteText}>{item.text}</Text>
            )}

            <View style={styles.iconRow}>
              <TouchableOpacity onPress={() => setEditingId(item.id)}>
                <Ionicons name="pencil" size={18} color="#555" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => deleteNote(item.id)}>
                <Ionicons name="trash" size={18} color="#e53935" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={addNote}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7fb",
    padding: 16,
  },

  authContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f6f7fb",
  },

  authTitle: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },

  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },

  primaryBtn: {
    backgroundColor: "#4f46e5",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },

  primaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  switchText: {
    marginTop: 16,
    textAlign: "center",
    color: "#555",
  },

  noteCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  noteText: {
    fontSize: 15,
    marginBottom: 10,
  },

  noteInput: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },

  iconRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
  },

  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#4f46e5",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
});
