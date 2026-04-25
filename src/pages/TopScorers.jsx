import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPlayers, getTeams } from "../firebase/firestoreUtils";
import { Loading, ErrorMessage } from "../components/Status";
import PosterLayout from "../components/PosterLayout";
import PosterHeader from "../components/PosterHeader";
import DownloadButton from "../components/DownloadButton";

const TopScorers = () => {
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [posterMode, setPosterMode] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pData, tData] = await Promise.all([getPlayers(), getTeams()]);
                setPlayers(pData.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals));
                setTeams(tData);
            } catch (err) {
                setError("Failed to load scorers.");
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
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/10 pb-8">
                <div className="text-center md:text-left space-y-2">
                    <p className="text-blue-500 font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">Golden Boot Race</p>
                    <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">TOP SCORERS</h1>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    {/* RESTORED POSTER MODE TOGGLE */}
                    <button 
                        onClick={() => setPosterMode(!posterMode)}
                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black uppercase tracking-tighter transition-all shadow-xl ${posterMode ? 'bg-white text-slate-950 hover:bg-gray-100' : 'bg-slate-900 text-white border border-white/20'}`}
                    >
                        {posterMode ? "Switch to Website View" : "✨ Poster Mode"}
                    </button>
                    {/* DOWNLOAD OPTION STILL COMMENTED OUT
                    {posterMode && <DownloadButton elementId="scorers-poster" filename="bcl-top-scorers" />}
                    */}
                </div>
            </div>

            {posterMode ? (
                /* RESPONSIVE POSTER CONTAINER */
                <div className="flex justify-center items-center py-4 overflow-hidden w-full">
                    <div className="relative transform scale-[0.3] sm:scale-[0.5] md:scale-[0.7] lg:scale-100 origin-center my-[-300px] sm:my-[-200px] md:my-[-100px] lg:my-0">
                        <PosterLayout id="scorers-poster">
                            <PosterHeader title="GOLDEN BOOT" subtitle="TOP SCORERS UPDATE" color="green" />
                            <div className="flex flex-col space-y-3 flex-grow w-full px-10 -mt-10 justify-start pt-4">
                                {players.slice(0, 5).map((p, idx) => (
                                    <div 
                                        key={p.id} 
                                        className="relative flex items-center p-5 rounded-[35px] overflow-hidden bg-white/10 border border-white/10 h-[125px] shadow-2xl"
                                    >
                                        <div className="text-4xl font-black italic mr-8 text-gray-700 min-w-[60px] flex items-center h-full">{getRankBadge(idx)}</div>
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl flex-shrink-0 bg-slate-950 self-center">
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
                                            <h3 className="text-3xl font-black uppercase tracking-tighter text-white italic leading-[1] pr-4">{p.name}</h3>
                                            <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-blue-400 leading-none">{teams.find(t => t.id === p.teamId)?.name}</p>
                                        </div>
                                        <div className="text-right pr-4 flex flex-col justify-center h-full min-w-[120px]">
                                            <span className="text-[10px] font-black uppercase tracking-widest block mb-1 text-blue-500 opacity-80 leading-none">Goals</span>
                                            <span className="text-5xl font-black italic tracking-tighter text-white leading-[1]">{p.goals}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </PosterLayout>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6">
                    {players.length > 0 ? players.map((p, idx) => (
                        <Link 
                            key={p.id} 
                            to={`/player/${p.id}`}
                            className="bg-slate-900 border border-white/5 rounded-[32px] p-4 md:p-6 flex items-center animate-fadeIn group hover:border-blue-500 transition-all hover-scale shadow-lg"
                        >
                             <div className="text-2xl md:text-4xl font-black italic text-gray-800 mr-4 md:mr-8 group-hover:text-blue-500 transition-colors">{getRankBadge(idx)}</div>
                             <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 border-white/10 bg-slate-800 flex-shrink-0">
                                {p.photoUrl ? (
                                    <img 
                                        src={p.photoUrl} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                        style={{ imageRendering: 'auto', WebkitBackfaceVisibility: 'hidden' }}
                                        alt="" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl md:text-3xl">👤</div>
                                )}
                             </div>
                             <div className="ml-4 md:ml-8 flex-grow">
                                <h3 className="text-lg md:text-2xl font-black text-white uppercase tracking-tighter italic leading-tight group-hover:text-blue-400 transition-colors">{p.name}</h3>
                                <p className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">{teams.find(t => t.id === p.teamId)?.name}</p>
                             </div>
                             <div className="text-right">
                                <span className="text-3xl md:text-5xl font-black italic text-blue-500">{p.goals}</span>
                                <p className="text-[8px] md:text-[10px] font-black text-gray-600 uppercase tracking-widest">Goals</p>
                             </div>
                        </Link>
                    )) : (
                        <div className="bg-slate-900 border border-white/5 rounded-[40px] p-20 text-center">
                            <p className="text-gray-500 font-black uppercase tracking-[0.3em]">No goals recorded yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TopScorers;
