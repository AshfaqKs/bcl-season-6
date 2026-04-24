import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPlayers, getTeams } from "../firebase/firestoreUtils";
import { Loading, ErrorMessage } from "../components/Status";
import PosterLayout from "../components/PosterLayout";
import PosterHeader from "../components/PosterHeader";
import DownloadButton from "../components/DownloadButton";

const TopAssists = () => {
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [posterMode, setPosterMode] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pData, tData] = await Promise.all([getPlayers(), getTeams()]);
                setPlayers(pData.sort((a, b) => b.assists - a.assists).slice(0, 5));
                setTeams(tData);
            } catch (err) {
                setError("Failed to load assists.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <Loading />;
    if (error) return <ErrorMessage message={error} />;

    const getRankBadge = (idx) => {
        if (idx === 0) return "🥇";
        if (idx === 1) return "🥈";
        if (idx === 2) return "🥉";
        return `#${idx + 1}`;
    };

    return (
        <div className="space-y-12 animate-fadeIn pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/10 pb-8">
                <div className="text-center md:text-left space-y-2">
                    <p className="text-cyan-400 font-black uppercase tracking-[0.3em] text-xs">Playmaker Award</p>
                    <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">TOP ASSISTS</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => setPosterMode(!posterMode)}
                        className={`px-6 py-3 rounded-xl font-black uppercase tracking-tighter transition-all shadow-xl ${posterMode ? 'bg-white text-slate-950 hover:bg-gray-100' : 'bg-slate-900 text-white border border-white/20'}`}
                    >
                        {posterMode ? "Switch to Website View" : "✨ Poster Mode"}
                    </button>
                    {posterMode && <DownloadButton elementId="assists-poster" filename="bcl-top-assists" />}
                </div>
            </div>

            {posterMode ? (
                <PosterLayout id="assists-poster">
                    <PosterHeader title="PLAYMAKERS" subtitle="TOP ASSISTS UPDATE" color="cyan" />
                    <div className="flex flex-col space-y-4 flex-grow w-full px-10 -mt-8">
                        {players.map((p, idx) => (
                            <div 
                                key={p.id} 
                                className="relative flex items-center p-6 rounded-[35px] overflow-hidden bg-white/10 border border-white/10 h-[135px] shadow-2xl"
                            >
                                <div className="text-5xl font-black italic mr-8 text-gray-700 min-w-[60px] flex items-center h-full">{getRankBadge(idx)}</div>
                                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl flex-shrink-0 bg-slate-950 self-center">
                                    {p.photoUrl ? (
                                        <img 
                                            src={p.photoUrl} 
                                            className="w-full h-full object-cover" 
                                            style={{ imageRendering: 'auto', WebkitBackfaceVisibility: 'hidden' }}
                                            alt="" 
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                                    )}
                                </div>
                                <div className="ml-8 flex-grow flex flex-col justify-center h-full">
                                    <h3 className="text-4xl font-black uppercase tracking-tighter text-white italic leading-[1] pr-4">{p.name}</h3>
                                    <p className="text-[12px] font-bold uppercase tracking-widest mt-2 text-cyan-400 leading-none">{teams.find(t => t.id === p.teamId)?.name}</p>
                                </div>
                                <div className="text-right pr-4 flex flex-col justify-center h-full min-w-[120px]">
                                    <span className="text-[12px] font-black uppercase tracking-widest block mb-1 text-cyan-400 opacity-80 leading-none">Assists</span>
                                    <span className="text-6xl font-black italic tracking-tighter text-white leading-[1]">{p.assists}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </PosterLayout>
            ) : (
                <div className="grid gap-6">
                    {players.map((p, idx) => (
                        <Link 
                            key={p.id} 
                            to={`/player/${p.id}`}
                            className="bg-slate-900 border border-white/5 rounded-3xl p-6 flex items-center animate-fadeIn group hover:border-cyan-500 transition-all hover-scale shadow-lg"
                        >
                             <div className="text-4xl font-black italic text-gray-800 mr-8 group-hover:text-cyan-500 transition-colors">{getRankBadge(idx)}</div>
                             <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 bg-slate-800 flex-shrink-0">
                                {p.photoUrl ? (
                                    <img 
                                        src={p.photoUrl} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                        style={{ imageRendering: 'auto', WebkitBackfaceVisibility: 'hidden' }}
                                        alt="" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                                )}
                             </div>
                             <div className="ml-8 flex-grow">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-tight group-hover:text-blue-400 transition-colors">{p.name}</h3>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">{teams.find(t => t.id === p.teamId)?.name}</p>
                             </div>
                             <div className="text-right">
                                <span className="text-5xl font-black italic text-cyan-400">{p.assists}</span>
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Assists</p>
                             </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TopAssists;
