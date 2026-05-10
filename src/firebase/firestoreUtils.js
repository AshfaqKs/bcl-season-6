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
            } else if (e.type === "double_yellow") {
                if (playerStats[e.playerId]) playerStats[e.playerId].red += 1;
            } else if (e.type === "clean_sheet") {
                if (playerStats[e.playerId]) playerStats[e.playerId].cleanSheets += 1;
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

export const getTopFourTeams = async () => {
    const [tData, pData, mData] = await Promise.all([getTeams(), getPlayers(), getMatches()]);
    
    const stats = tData.map(team => {
        const teamMatches = mData.filter(m => m.isCompleted && !m.isPlayoff && (m.teamA === team.id || m.teamB === team.id));
        let played = teamMatches.length;
        let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0, cardPoints = 0;

        teamMatches.forEach(m => {
            const isTeamA = m.teamA === team.id;
            const scoreMe = isTeamA ? m.scoreA : m.scoreB;
            const scoreThem = isTeamA ? m.scoreB : m.scoreA;
            gf += scoreMe;
            ga += scoreThem;
            if (scoreMe > scoreThem) wins++;
            else if (scoreMe === scoreThem) draws++;
            else losses++;

            (m.events || []).forEach(e => {
                const player = pData.find(p => p.id === e.playerId);
                if (player && player.teamId === team.id) {
                    if (e.type === "yellow") cardPoints += 1;
                    else if (e.type === "double_yellow") cardPoints += 3;
                    else if (e.type === "red") cardPoints += 4;
                }
            });
        });

        return { ...team, played, wins, draws, losses, gf, ga, gd: gf - ga, pts: (wins * 3) + draws, cardPoints };
    });

    return stats.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        const h2hMatches = mData.filter(m => m.isCompleted && !m.isPlayoff && ((m.teamA === a.id && m.teamB === b.id) || (m.teamA === b.id && m.teamB === a.id)));
        let aH2HGoals = 0, bH2HGoals = 0;
        h2hMatches.forEach(m => {
            if (m.teamA === a.id) { aH2HGoals += m.scoreA; bH2HGoals += m.scoreB; }
            else { aH2HGoals += m.scoreB; bH2HGoals += m.scoreA; }
        });
        if ((bH2HGoals - aH2HGoals) !== (aH2HGoals - bH2HGoals)) return (bH2HGoals - aH2HGoals) - (aH2HGoals - bH2HGoals);
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.cardPoints - b.cardPoints;
    }).slice(0, 4);
};

export const createPlayoffFixture = async (teamAId, teamBId, stage, date) => {
    const { addDoc, collection } = await import("firebase/firestore");
    await addDoc(collection(db, "matches"), {
        teamA: teamAId || "",
        teamB: teamBId || "",
        date: date,
        isCompleted: false,
        isPlayoff: true,
        playoffStage: stage,
        scoreA: 0,
        scoreB: 0,
        events: []
    });
};

export const saveAwards = async (awards) => {
    const { setDoc, doc } = await import("firebase/firestore");
    await setDoc(doc(db, "settings", "awards"), awards);
};

export const getAwards = async () => {
    const { getDoc, doc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, "settings", "awards"));
    return snap.exists() ? snap.data() : null;
};

export const saveHistory = async (history) => {
    const { setDoc, doc } = await import("firebase/firestore");
    await setDoc(doc(db, "settings", "history"), { seasons: history });
};

export const getHistory = async () => {
    const { getDoc, doc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, "settings", "history"));
    return snap.exists() ? snap.data().seasons : [];
};
