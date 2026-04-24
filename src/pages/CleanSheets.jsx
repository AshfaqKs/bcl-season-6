import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPlayers, getTeams } from "../firebase/firestoreUtils";
import { Loading, ErrorMessage } from "../components/Status";
import PosterLayout from "../components/PosterLayout";
import PosterHeader from "../components/PosterHeader";
import DownloadButton from "../components/DownloadButton";

const CleanSheets = () => {
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [posterMode, setPosterMode] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pData, tData] = await Promise.all([getPlayers(), getTeams()]);
                const gks = pData.filter(p => p.position === "GK").sort((a, b) => b.cleanSheets - a.cleanSheets).slice(0, 5);
                setPlayers(gks);
                setTeams(tData);
            } catch (err) {
                setError("Failed to load clean sheets.");
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
        <div className="space-y-12 animate-fadeIn pb-20 px-4 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/10 pb-8">
                <div className="text-center md:text-left space-y-2">
                    <p className="text-emerald-400 font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">Golden Gloves Race</p>
                    <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">CLEAN SHEETS</h1>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <button 
                        onClick={() => setPosterMode(!posterMode)}
                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black uppercase tracking-tighter transition-all shadow-xl ${posterMode ? 'bg-white text-slate-950 hover:bg-gray-100' : 'bg-slate-900 text-white border border-white/20'}`}
                    >
                        {posterMode ? "Switch to Website View" : "✨ Poster Mode"}
                    </button>
                    {posterMode && <DownloadButton elementId="gk-poster" filename="bcl-clean-sheets" />}
                </div>
            </div>

            {posterMode ? (
                <div className="flex justify-center items-center py-4 overflow-hidden w-full">
                    <div className="relative transform scale-[0.3] sm:scale-[0.5] md:scale-[0.7] lg:scale-100 origin-center my-[-300px] sm:my-[-200px] md:my-[-100px] lg:my-0">
                        <PosterLayout id="gk-poster">
                            <PosterHeader title="GOLDEN GLOVES" subtitle="CLEAN SHEETS UPDATE" color="emerald" />
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
                                                <div className="w-full h-full flex items-center justify-center text-4xl">🧤</div>
                                            )}
                                        </div>
                                        <div className="ml-8 flex-grow flex flex-col justify-center h-full">
                                            <h3 className="text-4xl font-black uppercase tracking-tighter text-white italic leading-[1] pr-4">{p.name}</h3>
                                            <p className="text-[12px] font-bold uppercase tracking-widest mt-2 text-emerald-400 leading-none">{teams.find(t => t.id === p.teamId)?.name}</p>
                                        </div>
                                        <div className="text-right pr-4 flex flex-col justify-center h-full min-w-[120px]">
                                            <span className="text-[12px] font-black uppercase tracking-widest block mb-1 text-emerald-400 opacity-80 leading-none">CS</span>
                                            <span className="text-6xl font-black italic tracking-tighter text-white leading-[1]">{p.cleanSheets}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </PosterLayout>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6">
                    {players.map((p, idx) => (
                        <Link 
                            key={p.id} 
                            to={`/player/${p.id}`}
                            className="bg-slate-900 border border-white/5 rounded-[32px] p-4 md:p-6 flex items-center animate-fadeIn group hover:border-emerald-500 transition-all hover-scale shadow-lg"
                        >
                             <div className="text-2xl md:text-4xl font-black italic text-gray-800 mr-4 md:mr-8 group-hover:text-emerald-500 transition-colors">{getRankBadge(idx)}</div>
                             <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 border-white/10 bg-slate-800 flex-shrink-0">
                                {p.photoUrl ? (
                                    <img 
                                        src={p.photoUrl} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                        style={{ imageRendering: 'auto', WebkitBackfaceVisibility: 'hidden' }}
                                        alt="" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl md:text-3xl">🧤</div>
                                )}
                             </div>
                             <div className="ml-4 md:ml-8 flex-grow">
                                <h3 className="text-lg md:text-2xl font-black text-white uppercase tracking-tighter italic leading-tight group-hover:text-blue-400 transition-colors">{p.name}</h3>
                                <p className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">{teams.find(t => t.id === p.teamId)?.name}</p>
                             </div>
                             <div className="text-right">
                                <span className="text-3xl md:text-5xl font-black italic text-emerald-400">{p.cleanSheets}</span>
                                <p className="text-[8px] md:text-[10px] font-black text-gray-600 uppercase tracking-widest">Clean Sheets</p>
                             </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CleanSheets;
