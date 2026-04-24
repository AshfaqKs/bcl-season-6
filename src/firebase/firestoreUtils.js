import { collection, getDocs, doc, writeBatch, query, where } from "firebase/firestore";
import { db } from "./firebase";

export const getTeams = async () => {
    try {
        const snapshot = await getDocs(collection(db, "teams"));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.error("Error fetching teams:", err);
        return [];
    }
};

export const getPlayers = async () => {
    try {
        const snapshot = await getDocs(collection(db, "players"));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.error("Error fetching players:", err);
        return [];
    }
};

export const getMatches = async () => {
    try {
        const snapshot = await getDocs(collection(db, "matches"));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.error("Error fetching matches:", err);
        return [];
    }
};

export const recomputeStats = async () => {
    const players = await getPlayers();
    const matches = await getMatches();

    const playerStats = {};
    players.forEach(p => {
        playerStats[p.id] = {
            matches: 0,
            goals: 0,
            assists: 0,
            cleanSheets: 0,
            yellow: 0,
            red: 0
        };
    });

    matches.forEach(m => {
        if (!m.isCompleted) return;

        const participants = [...(m.teamAPlayers || []), ...(m.teamBPlayers || [])];
        participants.forEach(pid => {
            if (playerStats[pid]) playerStats[pid].matches += 1;
        });

        if (m.scoreB === 0) {
            (m.teamAPlayers || []).forEach(pid => {
                if (playerStats[pid]) playerStats[pid].cleanSheets += 1;
            });
        }
        if (m.scoreA === 0) {
            (m.teamBPlayers || []).forEach(pid => {
                if (playerStats[pid]) playerStats[pid].cleanSheets += 1;
            });
        }

        (m.events || []).forEach(e => {
            if (e.type === "goal") {
                if (playerStats[e.playerId]) playerStats[e.playerId].goals += 1;
                if (e.assistPlayerId && playerStats[e.assistPlayerId]) {
                    playerStats[e.assistPlayerId].assists += 1;
                }
            } else if (e.type === "yellow") {
                if (playerStats[e.playerId]) playerStats[e.playerId].yellow += 1;
            } else if (e.type === "red") {
                if (playerStats[e.playerId]) playerStats[e.playerId].red += 1;
            }
        });
    });

    const batch = writeBatch(db);
    Object.keys(playerStats).forEach(pid => {
        const playerRef = doc(db, "players", pid);
        batch.update(playerRef, playerStats[pid]);
    });

    await batch.commit();
};
