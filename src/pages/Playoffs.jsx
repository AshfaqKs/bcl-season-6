import { useState, useEffect } from "react";
import { getMatches, getTeams } from "../firebase/firestoreUtils";
import { Loading, ErrorMessage } from "../components/Status";

const Playoffs = () => {
    const [data, setData] = useState({ matches: [], teams: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [m, t] = await Promise.all([getMatches(), getTeams()]);
                setData({ matches: m.filter(x => x.isPlayoff), teams: t });
            } catch (err) {
                setError("Failed to load playoff data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <Loading />;
    if (error) return <ErrorMessage message={error} />;

    const getMatchByStage = (stage) => data.matches.find(m => m.playoffStage === stage);
    const getTeam = (id) => data.teams.find(t => t.id === id);

    const groupEventsByPlayer = (events) => {
        const grouped = {};
        events.forEach(e => {
            if (!grouped[e.playerId]) grouped[e.playerId] = [];
            grouped[e.playerId].push(e.type);
        });
        return Object.entries(grouped);
    };

    const getIcon = (type) => {
        if (type === 'goal') return '⚽';
        if (type === 'yellow') return '🟨';
        if (type === 'double_yellow') return '🟨🟨';
        if (type === 'red') return '🟥';
        if (type === 'clean_sheet') return '🧤';
        return '';
    };

    const MatchCard = ({ stage, title, subtitle }) => {
        const match = getMatchByStage(stage);
        if (!match) return (
            <div className="bg-slate-900/50 border border-dashed border-white/10 p-8 rounded-[32px] text-center opacity-40">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">{title}</p>
                <p className="text-white font-black italic uppercase">TBD</p>
            </div>
        );

        const teamA = getTeam(match.teamA);
        const teamB = getTeam(match.teamB);
        const events = match.events || [];
        const eventsA = events.filter(e => {
            const p = data.players?.find(x => x.id === e.playerId);
            return p?.teamId === match.teamA;
        });
        const eventsB = events.filter(e => {
            const p = data.players?.find(x => x.id === e.playerId);
            return p?.teamId === match.teamB;
        });

        return (
            <div className="bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl relative overflow-hidden group hover:border-blue-500 transition-all">
                <div className="p-8 space-y-6">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest italic">{stage}</div>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2">
                                    {teamA?.logoUrl ? <img src={teamA.logoUrl} className="object-contain w-full h-full" alt="" /> : "🛡️"}
                                </div>
                                <span className="font-black text-white uppercase tracking-tighter italic">{teamA?.name || "TBD"}</span>
                            </div>
                            <span className="text-3xl font-black text-white italic">{match.isCompleted ? match.scoreA : "-"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2">
                                    {teamB?.logoUrl ? <img src={teamB.logoUrl} className="object-contain w-full h-full" alt="" /> : "🛡️"}
                                </div>
                                <span className="font-black text-white uppercase tracking-tighter italic">{teamB?.name || "TBD"}</span>
                            </div>
                            <span className="text-3xl font-black text-white italic">{match.isCompleted ? match.scoreB : "-"}</span>
                        </div>
                    </div>
                    {!match.isCompleted && (
                        <div className="mt-6 pt-4 border-t border-white/5 text-center">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                {new Date(match.date).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    )}
                </div>

                {match.isCompleted && events.length > 0 && (
                    <div className="px-8 pb-8 pt-4 bg-slate-950/30 border-t border-white/5 space-y-6">
                        <div className="grid grid-cols-2 gap-6 relative">
                            <div className="space-y-3 flex flex-col items-start border-r border-white/5 pr-4">
                                {groupEventsByPlayer(eventsA).map(([pid, types]) => (
                                    <div key={pid} className="flex items-center space-x-2">
                                        <div className="flex items-center space-x-1">
                                            {types.map((type, i) => <span key={i} className="text-xs">{getIcon(type)}</span>)}
                                        </div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase truncate max-w-[80px]">{data.players?.find(x => x.id === pid)?.name}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-3 flex flex-col items-start">
                                {groupEventsByPlayer(eventsB).map(([pid, types]) => (
                                    <div key={pid} className="flex items-center space-x-2">
                                        <div className="flex items-center space-x-1">
                                            {types.map((type, i) => <span key={i} className="text-xs">{getIcon(type)}</span>)}
                                        </div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase truncate max-w-[80px]">{data.players?.find(x => x.id === pid)?.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const grandFinal = getMatchByStage("Grand Final");
    const champion = (grandFinal && grandFinal.isCompleted) ? (grandFinal.scoreA > grandFinal.scoreB ? getTeam(grandFinal.teamA) : getTeam(grandFinal.teamB)) : null;

    return (
        <div className="space-y-16 animate-fadeIn pb-20">
            {champion && (
                <section className="relative p-12 md:p-16 rounded-[60px] overflow-hidden bg-gradient-to-br from-yellow-600 via-yellow-500 to-amber-700 shadow-[0_0_100px_rgba(234,179,8,0.3)] border-4 border-yellow-300/30 animate-winner w-full mb-20">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                        <p className="text-navy-dark font-black uppercase tracking-[0.5em] text-xs md:text-sm">Playoff Champions</p>
                        <h2 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-2xl">CUP WINNERS</h2>
                        
                        <div className="w-48 h-48 md:w-64 md:h-64 bg-white rounded-[40px] flex items-center justify-center p-8 shadow-2xl relative border-8 border-yellow-400 group">
                            {champion.logoUrl ? <img src={champion.logoUrl} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" alt="" /> : <span className="text-8xl">🏆</span>}
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-4xl md:text-6xl font-black text-navy-dark uppercase italic tracking-tighter">{champion.name}</h3>
                            <div className="inline-block bg-navy-dark text-yellow-400 px-10 py-3 rounded-full font-black uppercase tracking-widest text-xs md:text-sm shadow-xl">
                                🏆 BCL League Cup Champions
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <div className="text-center space-y-4">
                <p className="text-blue-500 font-black uppercase tracking-[0.4em] text-xs">The Road to Glory</p>
                <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase">PLAYOFF BRACKET</h1>
            </div>

            <div className="grid lg:grid-cols-3 gap-12 items-center">
                {/* Qualifiers Column */}
                <div className="space-y-12">
                    <MatchCard stage="Qualifier 1" title="Top 1 vs Top 2" />
                    <MatchCard stage="Eliminator" title="3rd vs 4th" />
                </div>

                {/* Path Logic Column */}
                <div className="flex flex-col items-center justify-center space-y-12 py-12">
                    <div className="w-px h-24 bg-gradient-to-b from-blue-500 to-transparent"></div>
                    <div className="bg-blue-600/10 border border-blue-500/20 px-8 py-4 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">NEXT STAGE</p>
                        <p className="text-white font-black italic uppercase text-lg">QUALIFIER 2</p>
                    </div>
                    <div className="w-px h-24 bg-gradient-to-t from-blue-500 to-transparent"></div>
                </div>

                {/* Final Reach Column */}
                <div className="space-y-12">
                    <MatchCard stage="Qualifier 2" title="Semi Final" />
                    <div className="pt-12">
                        <MatchCard stage="Grand Final" title="The Championship" />
                    </div>
                </div>
            </div>

            {/* IPL Legend Section */}
            {/* <div className="max-w-4xl mx-auto bg-slate-900 p-10 rounded-[40px] border border-white/5 shadow-2xl">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-8 border-b border-white/10 pb-4">Playoff Format</h3>
                <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Qualifier 1 winner goes to FINAL</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Eliminator loser is OUT</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Q2 = Q1 Loser vs EL Winner</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Grand Final determines the CHAMPION</p>
                        </div>
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default Playoffs;
