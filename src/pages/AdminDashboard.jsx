import { useState, useEffect } from "react";
import { db, auth } from "../firebase/firebase";
import { collection, addDoc, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Loading, ErrorMessage } from "../components/Status";
import { getTeams, getPlayers, recomputeStats } from "../firebase/firestoreUtils";

const AdminDashboard = () => {
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("teams");
    const [resultMatch, setResultMatch] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    // Form states
    const [teamName, setTeamName] = useState("");
    const [managerName, setManagerName] = useState("");
    const [managerAge, setManagerAge] = useState("");
    const [captainPlayerId, setCaptainPlayerId] = useState("");
    const [teamLogoUrl, setTeamLogoUrl] = useState("");

    const [playerName, setPlayerName] = useState("");
    const [playerAge, setPlayerAge] = useState("");
    const [playerPhotoUrl, setPlayerPhotoUrl] = useState("");
    const [playerPosition, setPlayerPosition] = useState("");
    const [playerTeamId, setPlayerTeamId] = useState("");
    const [matchEvents, setMatchEvents] = useState([]);

    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const [tData, pData, mSnapshot] = await Promise.all([
                getTeams(),
                getPlayers(),
                getDocs(collection(db, "matches"))
            ]);
            setTeams(tData);
            setPlayers(pData);
            setMatches(mSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setError("");
        } catch (err) {
            console.error("Fetch error:", err);
            // Display exact error message to help debugging
            setError(`Firebase Error: ${err.message || "Unknown Error"}. Please check if Firestore Rules are PUBLISHED.`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/admin/login");
    };

    const handleAddTeam = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            const teamData = {
                name: teamName,
                managerName: managerName,
                managerAge: parseInt(managerAge) || 0,
                captainPlayerId: captainPlayerId,
                logoUrl: teamLogoUrl
            };

            if (editingItem) {
                await updateDoc(doc(db, "teams", editingItem.id), teamData);
            } else {
                await addDoc(collection(db, "teams"), teamData);
            }

            setTeamName(""); setManagerName(""); setManagerAge(""); setCaptainPlayerId(""); setTeamLogoUrl(""); setEditingItem(null);
            fetchData();
        } catch (err) { setError(`Save Failed: ${err.message}`); } finally { setUploading(false); }
    };

    const handleAddPlayer = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            const playerData = {
                name: playerName,
                age: parseInt(playerAge) || 0,
                position: playerPosition,
                teamId: playerTeamId,
                photoUrl: playerPhotoUrl
            };

            if (editingItem) {
                await updateDoc(doc(db, "players", editingItem.id), playerData);
            } else {
                await addDoc(collection(db, "players"), {
                    ...playerData,
                    matches: 0, goals: 0, assists: 0, cleanSheets: 0, yellow: 0, red: 0
                });
            }
            setPlayerName(""); setPlayerAge(""); setPlayerPhotoUrl(""); setPlayerPosition(""); setEditingItem(null);
            fetchData();
        } catch (err) { setError(`Save Failed: ${err.message}`); } finally { setUploading(false); }
    };

    const handleDelete = async (coll, id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await deleteDoc(doc(db, coll, id));
            if (coll === "matches") await recomputeStats();
            fetchData();
        } catch (err) { setError(`Delete Failed: ${err.message}`); }
    };

    const handleAddFixture = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const matchData = {
            teamA: formData.get("teamA"),
            teamB: formData.get("teamB"),
            date: formData.get("date")
        };

        try {
            if (editingItem) {
                await updateDoc(doc(db, "matches", editingItem.id), matchData);
            } else {
                await addDoc(collection(db, "matches"), {
                    ...matchData,
                    scoreA: 0, scoreB: 0, isCompleted: false, events: [], teamAPlayers: [], teamBPlayers: []
                });
            }
            alert("Match saved!");
            setEditingItem(null);
            fetchData();
        } catch (err) { setError(`Match Save Failed: ${err.message}`); }
    };

    const handleAddResult = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const motm = formData.get("motm");
        if (!motm) return alert("Select Man of the Match!");

        try {
            const teamAPlayers = players.filter(p => p.teamId === resultMatch.teamA).map(p => p.id);
            const teamBPlayers = players.filter(p => p.teamId === resultMatch.teamB).map(p => p.id);
            const sanitizedEvents = matchEvents.map(ev => {
                const cleanEv = { type: ev.type, playerId: ev.playerId };
                if (ev.type === "goal" && ev.assistPlayerId) cleanEv.assistPlayerId = ev.assistPlayerId;
                return cleanEv;
            });

            await updateDoc(doc(db, "matches", resultMatch.id), {
                scoreA: parseInt(formData.get("scoreA")),
                scoreB: parseInt(formData.get("scoreB")),
                manOfTheMatchPlayerId: motm,
                isCompleted: true,
                events: sanitizedEvents,
                teamAPlayers,
                teamBPlayers
            });
            await recomputeStats();
            alert("Result saved!");
            setResultMatch(null); setMatchEvents([]);
            fetchData();
        } catch (err) { setError(`Result Save Failed: ${err.message}`); }
    };

    const handleRevertResult = async (matchId) => {
        if (!window.confirm("Revert this result back to a fixture? This will wipe scores and events.")) return;
        setUploading(true);
        try {
            await updateDoc(doc(db, "matches", matchId), {
                isCompleted: false,
                scoreA: 0,
                scoreB: 0,
                events: [],
                teamAPlayers: [],
                teamBPlayers: [],
                manOfTheMatchPlayerId: ""
            });
            await recomputeStats();
            alert("Result reverted to fixture!");
            fetchData();
        } catch (err) {
            setError(`Revert Failed: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const startEdit = (type, item) => {
        setEditingItem(item);
        if (type === 'team') {
            setTeamName(item.name);
            setManagerName(item.managerName || "");
            setManagerAge(item.managerAge || "");
            setCaptainPlayerId(item.captainPlayerId || "");
            setTeamLogoUrl(item.logoUrl || "");
            setActiveTab('teams');
        } else if (type === 'player') {
            setPlayerName(item.name);
            setPlayerAge(item.age || "");
            setPlayerPosition(item.position);
            setPlayerTeamId(item.teamId);
            setPlayerPhotoUrl(item.photoUrl || "");
            setActiveTab('players');
        } else if (type === 'match') {
            setActiveTab('schedule');
        }
        window.scrollTo(0, 0);
    };

    if (loading) return <Loading />;

    return (
        <div className="space-y-8 pb-20 bg-gray-100 min-h-screen p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-lg gap-4">
                <div className="flex items-center space-x-4">
                    {/* <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white text-2xl font-black">BCL</div> */}
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Admin <span className="text-blue-600">Hub</span></h1>
                </div>
                <button onClick={handleLogout} className="w-full md:w-auto bg-red-50 text-red-600 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-600 hover:text-white transition-all border border-red-100">Sign Out</button>
            </div>

            {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl"><p className="text-red-700 font-bold">{error}</p></div>}

            {uploading && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-12 rounded-[40px] text-center space-y-6 shadow-2xl animate-bounce">
                        <div className="text-5xl">⚽</div>
                        <p className="font-black uppercase tracking-[0.3em] text-slate-900">Updating League...</p>
                    </div>
                </div>
            )}

            <div className="flex space-x-2 border-b border-gray-200 overflow-x-auto pb-4 scrollbar-hide">
                {["teams", "players", "schedule", "fixtures"].map(tab => (
                    <button
                        key={tab}
                        className={`pb-3 px-8 font-black uppercase tracking-widest text-[10px] transition-all whitespace-nowrap rounded-xl ${activeTab === tab ? "bg-slate-900 text-white shadow-xl scale-105" : "text-gray-400 hover:text-slate-600 bg-white border border-gray-100"}`}
                        onClick={() => { setActiveTab(tab); setResultMatch(null); setEditingItem(null); }}
                    >
                        {tab === "schedule" ? "New Match" : tab === "fixtures" ? "Match Reports" : tab}
                    </button>
                ))}
            </div>

            {activeTab === "teams" && (
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 h-fit">
                        <h2 className="text-2xl font-black mb-8 text-slate-900 uppercase italic tracking-tighter border-b pb-4">{editingItem ? "Update Club" : "New Club"}</h2>
                        <form onSubmit={handleAddTeam} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Club Name</label>
                                <input type="text" placeholder="e.g. Madrid Strikers" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Manager</label>
                                    <input type="text" placeholder="Name" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={managerName} onChange={(e) => setManagerName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Age</label>
                                    <input type="number" placeholder="Age" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={managerAge} onChange={(e) => setManagerAge(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Team Logo (Free Hosting Link)</label>
                                <div className="flex flex-col space-y-3">
                                    <input type="text" placeholder="Paste link from ImgBB" className="w-full px-5 py-4 bg-gray-50 border border-blue-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={teamLogoUrl} onChange={(e) => setTeamLogoUrl(e.target.value)} />
                                    <a href="https://imgbb.com/" target="_blank" rel="noreferrer" className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">Get Free Link from ImgBB →</a>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl">{editingItem ? "Update Profile" : "Register Club"}</button>
                            {editingItem && <button type="button" onClick={() => { setEditingItem(null); setTeamName(""); setTeamLogoUrl(""); }} className="w-full bg-gray-100 py-3 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-[10px]">Cancel Edit</button>}
                        </form>
                    </div>

                    <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
                        <h2 className="text-2xl font-black mb-8 text-slate-900 uppercase italic tracking-tighter border-b pb-4">League Members</h2>
                        <div className="grid md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                            {teams.map(t => (
                                <div key={t.id} className="flex justify-between items-center p-5 bg-gray-50 rounded-[24px] border border-gray-100 hover:border-blue-200 transition-all group">
                                    <div className="flex items-center space-x-5">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shadow-sm border border-gray-100 overflow-hidden">
                                            {t.logoUrl ? <img src={t.logoUrl} alt="" className="object-contain" /> : "🛡️"}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 uppercase tracking-tighter text-lg">{t.name}</p>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Mgr: {t.managerName || "N/A"}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit('team', t)} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md">Edit</button>
                                        <button onClick={() => handleDelete("teams", t.id)} className="bg-red-50 text-red-600 px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest">Del</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "players" && (
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 h-fit">
                        <h2 className="text-2xl font-black mb-8 text-slate-900 uppercase italic tracking-tighter border-b pb-4">{editingItem ? "Modify Player" : "New Player"}</h2>
                        <form onSubmit={handleAddPlayer} className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</label>
                                    <input type="text" placeholder="Full Name" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={playerName} onChange={(e) => setPlayerName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Age</label>
                                    <input type="number" placeholder="Age" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={playerAge} onChange={(e) => setPlayerAge(e.target.value)} required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Photo (Free Hosting Link)</label>
                                <div className="flex flex-col space-y-3">
                                    <input type="text" placeholder="Paste link from ImgBB" className="w-full px-5 py-4 bg-gray-50 border border-blue-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={playerPhotoUrl} onChange={(e) => setPlayerPhotoUrl(e.target.value)} />
                                    <a href="https://imgbb.com/" target="_blank" rel="noreferrer" className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">Get Free Link from ImgBB →</a>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Position</label>
                                    <select className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={playerPosition} onChange={(e) => setPlayerPosition(e.target.value)} required>
                                        <option value="">Select</option>
                                        <option value="GK">GK</option>
                                        <option value="DEF">DEF</option>
                                        <option value="MID">MID</option>
                                        <option value="FWD">FWD</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Club</label>
                                    <select className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={playerTeamId} onChange={(e) => setPlayerTeamId(e.target.value)} required>
                                        <option value="">Select</option>
                                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl">{editingItem ? "Update Player" : "Register Player"}</button>
                            {editingItem && <button type="button" onClick={() => { setEditingItem(null); setPlayerName(""); setPlayerPhotoUrl(""); }} className="w-full bg-gray-100 py-3 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-[10px]">Cancel</button>}
                        </form>
                    </div>

                    <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
                        <h2 className="text-2xl font-black mb-8 text-slate-900 uppercase italic tracking-tighter border-b pb-4">League Personnel</h2>
                        <div className="grid md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                            {players.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-5 bg-gray-50 rounded-[24px] border border-gray-100 hover:border-blue-200 transition-all group">
                                    <div className="flex items-center space-x-5">
                                        <div className="w-16 h-16 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm p-1">
                                            {p.photoUrl ? <img src={p.photoUrl} alt="" className="w-full h-full object-cover rounded-xl" /> : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 uppercase tracking-tighter text-lg">{p.name} <span className="text-gray-300 font-bold italic text-sm">({p.age})</span></p>
                                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{p.position} • {teams.find(t => t.id === p.teamId)?.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit('player', p)} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md">Edit</button>
                                        <button onClick={() => handleDelete("players", p.id)} className="bg-red-50 text-red-600 px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest">Del</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "schedule" && (
                <div className="bg-white p-12 rounded-[40px] shadow-2xl max-w-2xl mx-auto border border-gray-100">
                    <h2 className="text-3xl font-black mb-10 border-b pb-6 text-slate-900 uppercase italic tracking-tighter">Schedule Match</h2>
                    <form onSubmit={handleAddFixture} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kick-off Date & Time</label>
                            <input name="date" type="datetime-local" className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-[24px] font-black text-slate-900 focus:ring-4 focus:ring-blue-100 outline-none transition-all" defaultValue={editingItem?.date ? new Date(editingItem.date).toISOString().slice(0, 16) : ""} required />
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Home Side</label>
                                <select name="teamA" className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-[24px] font-black text-slate-900 focus:ring-4 focus:ring-blue-100 outline-none" defaultValue={editingItem?.teamA} required>
                                    <option value="">Select Club</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Away Side</label>
                                <select name="teamB" className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-[24px] font-black text-slate-900 focus:ring-4 focus:ring-blue-100 outline-none" defaultValue={editingItem?.teamB} required>
                                    <option value="">Select Club</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button type="submit" className="flex-1 bg-blue-700 text-white py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-800 transition-all">
                                {editingItem ? "Confirm Changes" : "Create Fixture"}
                            </button>
                            {editingItem && <button type="button" onClick={() => setEditingItem(null)} className="bg-gray-100 px-10 rounded-[24px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>}
                        </div>
                    </form>
                </div>
            )}

            {activeTab === "fixtures" && (
                <div className="space-y-12 max-w-5xl mx-auto">
                    {resultMatch ? (
                        <div className="bg-white p-12 rounded-[40px] shadow-2xl border-4 border-blue-600 animate-fadeIn">
                            <div className="flex justify-between items-center mb-10 border-b pb-6">
                                <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">{resultMatch.isCompleted ? "Modify Match Report" : "Submit Match Report"}</h2>
                                <button onClick={() => { setResultMatch(null); setMatchEvents([]); }} className="bg-gray-100 text-gray-400 p-3 rounded-full hover:text-red-500 transition-colors font-black">×</button>
                            </div>
                            <form onSubmit={handleAddResult} className="space-y-10">
                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="bg-blue-50 p-10 rounded-[32px] text-center border border-blue-100">
                                        <p className="font-black text-blue-900 uppercase tracking-tighter text-2xl mb-6">{teams.find(t => t.id === resultMatch.teamA)?.name}</p>
                                        <input name="scoreA" type="number" placeholder="0" className="w-40 py-8 bg-white border-2 border-blue-200 rounded-3xl text-7xl font-black text-center text-slate-900 focus:border-blue-500 outline-none shadow-inner" defaultValue={resultMatch.scoreA} required min="0" />
                                    </div>
                                    <div className="bg-emerald-50 p-10 rounded-[32px] text-center border border-emerald-100">
                                        <p className="font-black text-emerald-900 uppercase tracking-tighter text-2xl mb-6">{teams.find(t => t.id === resultMatch.teamB)?.name}</p>
                                        <input name="scoreB" type="number" placeholder="0" className="w-40 py-8 bg-white border-2 border-emerald-200 rounded-3xl text-7xl font-black text-center text-slate-900 focus:border-emerald-500 outline-none shadow-inner" defaultValue={resultMatch.scoreB} required min="0" />
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-10 rounded-[40px] space-y-8 border border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-2xl">Match Timeline</h3>
                                        <div className="flex space-x-3">
                                            <button type="button" onClick={() => setMatchEvents([...matchEvents, { type: 'goal', playerId: '', assistPlayerId: '' }])} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">⚽ Goal</button>
                                            <button type="button" onClick={() => setMatchEvents([...matchEvents, { type: 'yellow', playerId: '' }])} className="bg-yellow-400 text-slate-950 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">🟨 Yellow</button>
                                            <button type="button" onClick={() => setMatchEvents([...matchEvents, { type: 'double_yellow', playerId: '' }])} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">🟨🟨 Double Yellow</button>
                                            <button type="button" onClick={() => setMatchEvents([...matchEvents, { type: 'red', playerId: '' }])} className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">🟥 Red</button>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {matchEvents.map((e, idx) => (
                                            <div key={idx} className="flex items-center space-x-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-blue-200">
                                                <div className={`w-3 h-12 rounded-full shrink-0 ${e.type === 'goal' ? 'bg-blue-500' : e.type === 'yellow' ? 'bg-yellow-400' : e.type === 'double_yellow' ? 'bg-orange-500' : 'bg-red-600'}`}></div>
                                                <select className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl text-slate-900 font-bold text-sm outline-none focus:border-blue-500" required value={e.playerId} onChange={(ev) => { const n = [...matchEvents]; n[idx].playerId = ev.target.value; setMatchEvents(n); }}>
                                                    <option value="">Select Scorer / Recipient</option>
                                                    {players.filter(p => p.teamId === resultMatch.teamA || p.teamId === resultMatch.teamB).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                                {e.type === 'goal' && (
                                                    <select className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl text-slate-900 font-bold text-sm outline-none focus:border-blue-500" value={e.assistPlayerId} onChange={(ev) => { const n = [...matchEvents]; n[idx].assistPlayerId = ev.target.value; setMatchEvents(n); }}>
                                                        <option value="">Assisted By (Optional)</option>
                                                        {players.filter(p => p.teamId === resultMatch.teamA || p.teamId === resultMatch.teamB).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                    </select>
                                                )}
                                                <button type="button" onClick={() => setMatchEvents(matchEvents.filter((_, i) => i !== idx))} className="text-red-500 font-black text-3xl px-3 hover:scale-125 transition-transform">×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Man of the Match</label>
                                    <select name="motm" className="w-full px-8 py-5 bg-gray-50 border border-gray-200 rounded-[24px] font-black text-slate-900 focus:ring-4 focus:ring-blue-100 outline-none" defaultValue={resultMatch.manOfTheMatchPlayerId} required>
                                        <option value="">Select Recipient</option>
                                        {players.filter(p => p.teamId === resultMatch.teamA || p.teamId === resultMatch.teamB).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[30px] font-black uppercase tracking-[0.3em] text-xl shadow-2xl hover:bg-black transition-all hover:scale-[1.02] active:scale-95">Publish Match Report</button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <section>
                                <h2 className="text-2xl font-black mb-8 text-slate-900 uppercase italic tracking-tighter border-l-8 border-blue-600 pl-4">📅 Upcoming Fixtures</h2>
                                <div className="grid gap-6">
                                    {matches.filter(m => !m.isCompleted).sort((a, b) => new Date(a.date) - new Date(b.date)).map(m => (
                                        <div key={m.id} className="flex justify-between items-center p-10 bg-white rounded-[40px] border border-gray-100 hover:border-blue-400 transition-all group shadow-sm hover:shadow-xl">
                                            <div className="flex items-center space-x-12">
                                                <div className="text-center bg-gray-50 p-5 rounded-3xl min-w-[140px] border border-gray-100 shadow-inner">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{new Date(m.date).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                                                    <p className="text-2xl font-black text-slate-900">{new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                                                </div>
                                                <div className="flex items-center space-x-10">
                                                    <div className="text-right w-44 font-black text-2xl text-slate-900 uppercase tracking-tighter">{teams.find(t => t.id === m.teamA)?.name}</div>
                                                    <div className="text-blue-600 font-black italic text-xl">VS</div>
                                                    <div className="text-left w-44 font-black text-2xl text-slate-900 uppercase tracking-tighter">{teams.find(t => t.id === m.teamB)?.name}</div>
                                                </div>
                                            </div>
                                            <div className="flex space-x-4 opacity-0 group-hover:opacity-100 transition-all translate-x-10 group-hover:translate-x-0">
                                                <button onClick={() => { setResultMatch(m); setMatchEvents([]); }} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-blue-600 transition-colors">Submit Report</button>
                                                <button onClick={() => startEdit('match', m)} className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline">Reschedule</button>
                                                <button onClick={() => handleDelete("matches", m.id)} className="text-red-500 font-black text-3xl px-2 hover:scale-125 transition-transform">×</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-black mb-8 text-slate-900 uppercase italic tracking-tighter border-l-8 border-gray-400 pl-4">🏆 Published Reports</h2>
                                <div className="grid gap-6">
                                    {matches.filter(m => m.isCompleted).sort((a, b) => new Date(b.date) - new Date(a.date)).map(m => (
                                        <div key={m.id} className="flex justify-between items-center p-10 bg-white rounded-[40px] shadow-md border border-gray-100 group hover:shadow-xl transition-all">
                                            <div className="flex items-center space-x-12">
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[120px] text-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                    <div>{new Date(m.date).toLocaleDateString([], { day: 'numeric', month: 'short' })}</div>
                                                    <div className="text-slate-900 mt-1">{new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                                                </div>
                                                <div className="flex items-center space-x-10">
                                                    <div className="text-right w-44 font-black text-2xl text-slate-900 uppercase tracking-tighter">{teams.find(t => t.id === m.teamA)?.name}</div>
                                                    <div className="flex items-center space-x-4 bg-slate-900 text-white px-8 py-4 rounded-[24px] font-black text-4xl italic shadow-2xl border-b-4 border-blue-600">
                                                        <span>{m.scoreA}</span>
                                                        <span className="text-gray-600">-</span>
                                                        <span>{m.scoreB}</span>
                                                    </div>
                                                    <div className="text-left w-44 font-black text-2xl text-slate-900 uppercase tracking-tighter">{teams.find(t => t.id === m.teamB)?.name}</div>
                                                </div>
                                            </div>
                                            <div className="flex space-x-6 opacity-0 group-hover:opacity-100 transition-all items-center">
                                                <button onClick={() => { setResultMatch(m); setMatchEvents(m.events || []); }} className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline">Edit Report</button>
                                                <button onClick={() => handleRevertResult(m.id)} className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border border-orange-100 hover:bg-orange-600 hover:text-white transition-all">Revert to Fixture</button>
                                                <button onClick={() => handleDelete("matches", m.id)} className="text-red-500 font-black text-3xl px-2 hover:scale-125 transition-transform">×</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
