import { useState, useEffect } from "react";
import { getMatches, getTeams, getPlayers } from "../firebase/firestoreUtils";
import { Loading, ErrorMessage } from "../components/Status";
import PosterLayout from "../components/PosterLayout";
import PosterHeader from "../components/PosterHeader";
import DownloadButton from "../components/DownloadButton";

const Matches = () => {
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [posterMode, setPosterMode] = useState(false);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [mData, tData, pData] = await Promise.all([getMatches(), getTeams(), getPlayers()]);
                // SORTING: Nearest match first (Ascending date)
                setMatches(mData.sort((a, b) => new Date(a.date) - new Date(a.date))); // Wait, I made a mistake in previous sort, fixing it now. 
                // Actually new Date(a.date) - new Date(b.date) is ascending.
                setMatches(mData.sort((a, b) => new Date(a.date) - new Date(b.date)));
                setTeams(tData);
                setPlayers(pData);
            } catch (err) {
                setError("Failed to load matches.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <Loading />;
    if (error) return <ErrorMessage message={error} />;

    const filteredMatches = matches.filter(m => {
        if (filter === "fixtures") return !m.isCompleted;
        if (filter === "results") return m.isCompleted;
        return true;
    });

    const groupedMatches = filteredMatches.reduce((groups, match) => {
        const date = new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        if (!groups[date]) groups[date] = [];
        groups[date].push(match);
        return groups;
    }, {});

    const dates = Object.keys(groupedMatches);

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
        if (type === 'red') return '🟥';
        return '';
    };

    return (
        <div className="space-y-12 pb-20 animate-fadeIn px-4 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/10 pb-8">
                <div className="text-center md:text-left space-y-2">
                    <p className="text-blue-500 font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">Match Center</p>
                    <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase">FIXTURES & RESULTS</h1>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <select 
                        className="w-full sm:w-auto bg-slate-900 text-white px-4 py-3 rounded-xl border border-white/20 font-black uppercase text-xs outline-none shadow-lg appearance-none cursor-pointer"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Matches</option>
                        <option value="fixtures">Upcoming Only</option>
                        <option value="results">Recent Results</option>
                    </select>
                    
                    {/* RESTORED POSTER MODE TOGGLE */}
                    <button 
                        onClick={() => setPosterMode(!posterMode)}
                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black uppercase tracking-tighter transition-all shadow-xl ${posterMode ? 'bg-white text-slate-950 hover:bg-gray-100' : 'bg-slate-900 text-white border border-white/20'}`}
                    >
                        {posterMode ? "Switch to Website View" : "📅 Matchday Poster"}
                    </button>
                </div>
            </div>

            {posterMode ? (
                <div className="space-y-20 flex flex-col items-center">
                    {dates.map(date => (
                        <div key={date} className="space-y-8 flex flex-col items-center w-full">
                            {/* POSTER DOWNLOAD STILL COMMENTED OUT
                            <DownloadButton elementId={`poster-${date.replace(/\s+/g, '-')}`} filename={`bcl-matchday-${date}`} label={`Download ${date} Graphic`} />
                            */}
                            
                            <div className="flex justify-center items-center py-4 overflow-hidden w-full">
                                <div className="relative transform scale-[0.3] sm:scale-[0.5] md:scale-[0.7] lg:scale-100 origin-center my-[-300px] sm:my-[-200px] md:my-[-100px] lg:my-0">
                                    <PosterLayout id={`poster-${date.replace(/\s+/g, '-')}`}>
                                        <PosterHeader title="MATCHDAY" subtitle={date.toUpperCase()} color="blue" />
                                        <div className="flex-grow flex flex-col justify-center space-y-6 w-full px-10">
                                            {groupedMatches[date].slice(0, 4).map(match => {
                                                const teamA = teams.find(t => t.id === match.teamA);
                                                const teamB = teams.find(t => t.id === match.teamB);
                                                return (
                                                    <div key={match.id} className="bg-white/10 border border-white/10 rounded-[40px] p-8 flex items-center justify-between relative overflow-hidden h-[180px] shadow-2xl">
                                                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                                                            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center p-3 border-2 border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.3)] shrink-0">
                                                                {teamA?.logoUrl ? <img src={teamA.logoUrl} className="w-full h-full object-contain" alt="" /> : <span className="text-4xl">🛡️</span>}
                                                            </div>
                                                            <span className="text-xl font-black text-white uppercase tracking-tighter w-full text-center leading-[1] italic pr-2 h-6 flex items-center justify-center">{teamA?.name}</span>
                                                        </div>

                                                        <div className="mx-8 flex flex-col items-center justify-center min-w-[180px] h-full">
                                                            {match.isCompleted ? (
                                                                <div className="bg-white text-slate-950 px-8 py-3 rounded-2xl font-black text-5xl shadow-2xl italic tracking-tighter leading-[1] flex items-center justify-center h-20">
                                                                    {match.scoreA} - {match.scoreB}
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center space-y-2 h-20">
                                                                    <div className="text-blue-500 font-black text-4xl italic tracking-widest leading-none">VS</div>
                                                                    <div className="text-[12px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">
                                                                        {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                                                            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center p-3 border-2 border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.3)] shrink-0">
                                                                {teamB?.logoUrl ? <img src={teamB.logoUrl} className="w-full h-full object-contain" alt="" /> : <span className="text-4xl">🛡️</span>}
                                                            </div>
                                                            <span className="text-xl font-black text-white uppercase tracking-tighter w-full text-center leading-[1] italic pr-2 h-6 flex items-center justify-center">{teamB?.name}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </PosterLayout>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid gap-8 max-w-4xl mx-auto">
                    {filteredMatches.map(match => {
                        const teamA = teams.find(t => t.id === match.teamA);
                        const teamB = teams.find(t => t.id === match.teamB);
                        const motm = players.find(p => p.id === match.manOfTheMatchPlayerId);
                        const events = match.events || [];
                        const eventsA = events.filter(e => players.find(x => x.id === e.playerId)?.teamId === match.teamA);
                        const eventsB = events.filter(e => players.find(x => x.id === e.playerId)?.teamId === match.teamB);

                        return (
                            <div key={match.id} className="animate-fadeIn">
                                <div className="bg-slate-900 border border-white/10 rounded-[40px] overflow-hidden hover:border-blue-500 transition-all shadow-2xl">
                                    <div className="p-4 bg-slate-950/50 flex justify-center border-b border-white/5">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {new Date(match.date).toLocaleString([], { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </p>
                                    </div>
                                    
                                    <div className="p-6 md:p-14 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 relative">
                                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                                            <div className="w-24 h-24 md:w-36 md:h-36 bg-white rounded-[32px] flex items-center justify-center border-2 border-white/10 overflow-hidden p-5 shadow-2xl">
                                                {teamA?.logoUrl ? <img src={teamA.logoUrl} className="w-full h-full object-contain" alt="" /> : <span className="text-5xl">🛡️</span>}
                                            </div>
                                            <h3 className="text-sm md:text-2xl font-black text-white uppercase tracking-tighter text-center leading-tight italic">{teamA?.name}</h3>
                                        </div>

                                        <div className="flex flex-col items-center min-w-[140px]">
                                            {match.isCompleted ? (
                                                <div className="flex items-center space-x-3 bg-white text-slate-950 px-6 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-3xl font-black text-4xl md:text-6xl shadow-2xl italic tracking-tighter border-2 border-white/10">
                                                    <span>{match.scoreA}</span>
                                                    <span className="text-gray-300">-</span>
                                                    <span>{match.scoreB}</span>
                                                </div>
                                            ) : (
                                                /* REPLACED FIXTURE WITH VS */
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="text-blue-500 font-black text-4xl md:text-6xl italic tracking-widest leading-none">VS</div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                                            <div className="w-24 h-24 md:w-36 md:h-36 bg-white rounded-[32px] flex items-center justify-center border-2 border-white/10 overflow-hidden p-5 shadow-2xl">
                                                {teamB?.logoUrl ? <img src={teamB.logoUrl} className="w-full h-full object-contain" alt="" /> : <span className="text-5xl">🛡️</span>}
                                            </div>
                                            <h3 className="text-sm md:text-2xl font-black text-white uppercase tracking-tighter text-center leading-tight italic">{teamB?.name}</h3>
                                        </div>
                                    </div>

                                    {match.isCompleted && (
                                        <div className="px-6 md:px-10 pb-10 md:pb-12 pt-6 bg-slate-950/30 border-t border-white/5 space-y-10">
                                            <div className="grid grid-cols-2 gap-8 md:gap-16 relative">
                                                <div className="space-y-5 flex flex-col items-center">
                                                    {groupEventsByPlayer(eventsA).map(([pid, types]) => (
                                                        <div key={pid} className="flex flex-col items-center space-y-1.5 group/ev">
                                                            <div className="flex items-center space-x-2 h-8">
                                                                {types.map((type, i) => <span key={i} className="text-lg scale-110 md:scale-125">{getIcon(type)}</span>)}
                                                            </div>
                                                            <span className="text-[10px] md:text-xs font-black text-gray-300 uppercase tracking-tighter group-hover/ev:text-blue-400 transition-colors text-center">{players.find(x => x.id === pid)?.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="space-y-5 flex flex-col items-center">
                                                    {groupEventsByPlayer(eventsB).map(([pid, types]) => (
                                                        <div key={pid} className="flex flex-col items-center space-y-1.5 group/ev">
                                                            <div className="flex items-center space-x-2 h-8">
                                                                {types.map((type, i) => <span key={i} className="text-lg scale-110 md:scale-125">{getIcon(type)}</span>)}
                                                            </div>
                                                            <span className="text-[10px] md:text-xs font-black text-gray-300 uppercase tracking-tighter group-hover/ev:text-blue-400 transition-colors text-center">{players.find(x => x.id === pid)?.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            {motm && (
                                                <div className="flex justify-center pt-6">
                                                    <div className="flex items-center space-x-4 bg-blue-600/10 px-6 md:px-8 py-3 rounded-2xl border-2 border-blue-600/20 shadow-2xl text-center">
                                                        <span className="text-lg md:text-xl">⭐</span>
                                                        <span className="text-[10px] md:text-xs font-black text-blue-400 uppercase tracking-widest leading-relaxed">POTM: <span className="text-white ml-2 md:ml-3 italic">{motm.name}</span></span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Matches;
