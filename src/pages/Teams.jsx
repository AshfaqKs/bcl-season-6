import { useState, useEffect } from "react";
import { getTeams, getPlayers } from "../firebase/firestoreUtils";
import { Loading, ErrorMessage } from "../components/Status";
import { Link } from "react-router-dom";

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedTeam, setSelectedTeam] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tData, pData] = await Promise.all([getTeams(), getPlayers()]);
                setTeams(tData);
                setPlayers(pData);
                if (tData.length > 0) setSelectedTeam(tData[0]);
            } catch (err) {
                setError("Failed to load teams.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <Loading />;
    if (error) return <ErrorMessage message={error} />;

    const squad = players.filter(p => p.teamId === selectedTeam?.id);
    const captain = squad.find(p => p.id === selectedTeam?.captainPlayerId);
    const restOfSquad = squad.filter(p => p.id !== selectedTeam?.captainPlayerId);

    return (
        <div className="space-y-12 pb-20">
            <div className="flex space-x-2 overflow-x-auto pb-4 scrollbar-hide border-b border-white/10">
                {teams.map(t => (
                    <button 
                        key={t.id} 
                        onClick={() => setSelectedTeam(t)}
                        className={`px-6 py-3 rounded-xl font-black uppercase tracking-tighter transition-all whitespace-nowrap ${selectedTeam?.id === t.id ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-slate-900 text-gray-400 hover:text-white border border-white/5'}`}
                    >
                        {t.name}
                    </button>
                ))}
            </div>

            {selectedTeam && (
                <div className="animate-fadeIn space-y-12">
                    <div className="bg-slate-900 rounded-[40px] border border-white/10 p-8 md:p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>
                        
                        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                            <div className="w-32 h-32 md:w-48 md:h-48 bg-white rounded-3xl flex items-center justify-center p-6 border-4 border-white/10 shadow-2xl">
                                {selectedTeam.logoUrl ? <img src={selectedTeam.logoUrl} className="w-full h-full object-contain" alt="" /> : <span className="text-6xl">🛡️</span>}
                            </div>
                            
                            <div className="flex-grow text-center md:text-left space-y-6">
                                <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">{selectedTeam.name}</h1>
                                <div className="inline-flex items-center space-x-6 bg-slate-800/50 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10">
                                    <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 text-2xl">👔</div>
                                    <div>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Team Manager</p>
                                        <p className="text-xl font-bold text-white uppercase">{selectedTeam.managerName || "Unassigned"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center space-x-4 border-b border-white/10 pb-4">
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Official Squad</h2>
                            <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-black uppercase">{squad.length} Players</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {captain && (
                                <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                                    <Link to={`/player/${captain.id}`} className="bg-gradient-to-br from-blue-600/30 to-slate-900 p-[2px] rounded-[32px] shadow-[0_0_30px_rgba(37,99,235,0.1)] group block">
                                        <div className="bg-slate-900 rounded-[30px] p-6 flex items-center space-x-8 relative overflow-hidden">
                                            <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Captain</div>
                                            <div className="w-24 h-24 md:w-40 md:h-40 rounded-2xl overflow-hidden border-2 border-white/10 flex-shrink-0 bg-slate-800 shadow-2xl">
                                                {captain.photoUrl ? <img src={captain.photoUrl} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" alt="" /> : <div className="w-full h-full flex items-center justify-center text-5xl">👤</div>}
                                            </div>
                                            <div className="flex-grow">
                                                <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter group-hover:text-blue-400 transition-colors italic">{captain.name}</h3>
                                                <div className="flex items-center space-x-4 mt-2">
                                                    <span className="text-blue-400 font-black text-xs uppercase tracking-widest">{captain.position}</span>
                                                    <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Age: {captain.age || "???"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            )}

                            {restOfSquad.map(p => (
                                <Link key={p.id} to={`/player/${p.id}`} className="bg-slate-900 border border-white/5 rounded-[32px] overflow-hidden hover:border-blue-500 transition-all group relative block">
                                    <div className="aspect-[3/4] relative bg-slate-800 overflow-hidden">
                                        {p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" alt="" /> : <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">👤</div>}
                                        {/* REMOVED GRADIENT OVERLAY FOR CLARITY */}
                                    </div>
                                    <div className="p-6 bg-slate-900 border-t border-white/5">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter group-hover:text-blue-400 transition-colors">{p.name}</h3>
                                        <div className="flex justify-between items-center mt-2">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.position}</p>
                                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Age: {p.age || "???"}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Teams;
