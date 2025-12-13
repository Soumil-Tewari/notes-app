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
      const fetched: Note[] = snap.docs.map((d) => ({
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
    } catch {
      
    }
  };

  const deleteFromCloud = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notes", id));
    } catch {
     
    }
  };

  

  const addNote = async () => {
    const newNote: Note = {
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

    const note = updated.find((n) => n.id === id)!;
    await persistLocal(updated);
    await syncNote(note);
  };

  const deleteNote = async (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    await persistLocal(updated);
    await deleteFromCloud(id);
  };


  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          {isSignup ? "Create Account" : "Login"}
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

        <TouchableOpacity style={styles.btn} onPress={handleAuth}>
          <Text>{isSignup ? "Sign Up" : "Login"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
          <Text style={styles.switchText}>
            {isSignup ? "Login instead" : "Create account"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }



  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={logout}>
        <Text style={styles.logout}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={addNote}>
        <Text>Add Note</Text>
      </TouchableOpacity>

      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => (
          <View style={styles.note}>
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

            <TouchableOpacity onPress={() => setEditingId(item.id)}>
              <Ionicons name="pencil" size={18} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => deleteNote(item.id)}>
              <Ionicons name="trash" size={18} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 60,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
  btn: {
    backgroundColor: "#e0e0e0",
    padding: 12,
    alignItems: "center",
    borderRadius: 6,
    marginBottom: 12,
  },
  switchText: {
    marginTop: 10,
    textAlign: "center",
    color: "#555",
  },
  logout: {
    marginBottom: 10,
    color: "#555",
  },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 6,
    marginBottom: 6,
  },
  noteText: {
    flex: 1,
  },
  noteInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#999",
  },
});
