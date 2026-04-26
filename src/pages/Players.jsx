import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPlayers, getTeams } from "../firebase/firestoreUtils";
import { Loading } from "../components/Status";

const Players = () => {
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTeam, setFilterTeam] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            const [pData, tData] = await Promise.all([getPlayers(), getTeams()]);
            setPlayers(pData);
            setTeams(tData);
            setLoading(false);
        };
        fetchData();
    }, []);

    const filteredPlayers = players.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTeam = filterTeam === "" || p.teamId === filterTeam;
        return matchesSearch && matchesTeam;
    });

    if (loading) return <Loading />;

    return (
        <div className="space-y-12 pb-20">
            {/* Minimalist Search & Filter Header */}
            <div className="bg-slate-900 p-8 md:p-12 rounded-[40px] shadow-2xl relative overflow-hidden border border-white/5">
                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-blue-500 rounded-full blur-[100px]"></div>
                </div>
                
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 relative z-10">
                    <input 
                        type="text" 
                        placeholder="SEARCH PLAYER NAME..." 
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none backdrop-blur-md transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select 
                        className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none backdrop-blur-md transition-all appearance-none cursor-pointer"
                        value={filterTeam}
                        onChange={(e) => setFilterTeam(e.target.value)}
                    >
                        <option value="" className="bg-slate-900">ALL CLUBS</option>
                        {teams.map(t => <option key={t.id} value={t.id} className="bg-slate-900">{t.name.toUpperCase()}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredPlayers.map(p => (
                    <Link 
                        key={p.id} 
                        to={`/player/${p.id}`}
                        className="group relative bg-slate-900 rounded-[32px] overflow-hidden border border-white/5 hover:border-blue-500 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:-translate-y-2 block"
                    >
                        {/* Player Photo Section */}
                        <div className="aspect-[3/4] relative overflow-hidden bg-slate-800">
                            {p.photoUrl ? (
                                <img 
                                    src={p.photoUrl} 
                                    alt={p.name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://via.placeholder.com/400x500/0f172a/ffffff?text=PHOTO+ERROR";
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
                                    <span className="text-8xl opacity-20">👤</span>
                                </div>
                            )}
                            
                            {/* Position Tag */}
                            <div className="absolute top-6 left-6">
                                <div className="bg-blue-600/90 backdrop-blur-md text-white px-4 py-1.5 rounded-xl font-black text-[10px] tracking-widest shadow-2xl border border-white/10">
                                    {p.position}
                                </div>
                            </div>
                        </div>

                        {/* Player Info Section */}
                        <div className="p-8 space-y-4 relative bg-slate-900 border-t border-white/5">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight group-hover:text-blue-400 transition-colors">
                                    {p.name}
                                </h3>
                                <p className="text-blue-500 font-black uppercase tracking-widest text-[10px]">
                                    {teams.find(t => t.id === p.teamId)?.name || "Free Agent"}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Goals</p>
                                    <p className="text-lg font-black text-white italic">{p.goals || 0}</p>
                                </div>
                                <div className="text-center border-l border-white/5">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Assists</p>
                                    <p className="text-lg font-black text-white italic">{p.assists || 0}</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredPlayers.length === 0 && (
                <div className="text-center py-20 bg-slate-900/50 rounded-[40px] border border-dashed border-white/10">
                    <p className="text-slate-500 font-black uppercase tracking-widest">No players found in this category.</p>
                </div>
            )}
        </div>
    );
};

export default Players;