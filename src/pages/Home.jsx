import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMatches, getTeams, getPlayers } from "../firebase/firestoreUtils";
import { Loading } from "../components/Status";

const Home = () => {
    const [data, setData] = useState({ matches: [], teams: [], players: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const [m, t, p] = await Promise.all([getMatches(), getTeams(), getPlayers()]);
            setData({ matches: m, teams: t, players: p });
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <Loading />;

    const recentMatches = data.matches.filter(m => m.isCompleted).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
    const upcomingMatches = data.matches.filter(m => !m.isCompleted).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3);

    return (
        <div className="space-y-24 animate-fadeIn pb-20">
            {/* Hero Section */}
            <section className="relative h-[70vh] flex items-center justify-center rounded-[50px] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-slate-950 opacity-60"></div>
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500 rounded-full blur-[150px]"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-500 rounded-full blur-[150px]"></div>
                </div>

                <div className="text-center relative z-10 space-y-8 px-4">
                    <p className="text-blue-500 font-black uppercase tracking-[0.6em] text-xs md:text-sm animate-pulse">Official League Hub</p>
                    <div className="space-y-2">
                        <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter text-white uppercase leading-none">
                            BCL <span className="text-blue-500 italic">SEASON 6</span>
                        </h1>
                        <p className="text-gray-400 font-black uppercase tracking-[0.4em] text-xs md:text-sm">Battle of the Champions</p>
                    </div>
                    <div className="flex justify-center pt-4">
                        <Link to="/matches" className="bg-white text-slate-950 px-10 py-4 rounded-2xl font-black uppercase tracking-tighter hover:bg-blue-500 hover:text-white transition-all shadow-2xl">
                            View Full Schedule
                        </Link>
                    </div>
                </div>
            </section>

            {/* Quick Stats Grid */}
            <div className="grid lg:grid-cols-2 gap-16">
                {/* Recent Results */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between border-l-4 border-blue-600 pl-6">
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Latest Results</h2>
                        <Link to="/matches" className="text-blue-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors">See All →</Link>
                    </div>
                    <div className="space-y-6">
                        {recentMatches.map(m => {
                            const teamA = data.teams.find(t => t.id === m.teamA);
                            const teamB = data.teams.find(t => t.id === m.teamB);
                            return (
                                <div key={m.id} className="bg-slate-900 p-8 rounded-[32px] border border-white/5 hover:border-blue-500/30 transition-all flex justify-between items-center group shadow-xl">
                                    <div className="flex flex-col items-center flex-1 space-y-3">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shadow-2xl shrink-0">
                                            {teamA?.logoUrl ? <img src={teamA.logoUrl} className="w-full h-full object-contain" alt="" /> : <span className="text-2xl">🛡️</span>}
                                        </div>
                                        <div className="font-black uppercase tracking-tighter text-white text-xs md:text-sm text-center italic">{teamA?.name}</div>
                                    </div>

                                    <div className="mx-8 flex flex-col items-center">
                                        <div className="bg-white text-slate-950 px-6 py-2 rounded-2xl font-black text-3xl italic shadow-2xl border-2 border-white/10">
                                            {m.scoreA} - {m.scoreB}
                                        </div>
                                        <div className="text-center mt-2 flex flex-col items-center">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic leading-none">Final Score</span>
                                            <span className="text-[8px] font-black text-blue-500/60 uppercase tracking-[0.2em] mt-1.5 leading-none">
                                                {new Date(m.date).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center flex-1 space-y-3">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shadow-2xl shrink-0">
                                            {teamB?.logoUrl ? <img src={teamB.logoUrl} className="w-full h-full object-contain" alt="" /> : <span className="text-2xl">🛡️</span>}
                                        </div>
                                        <div className="font-black uppercase tracking-tighter text-white text-xs md:text-sm text-center italic">{teamB?.name}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Upcoming Fixtures */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between border-l-4 border-cyan-500 pl-6">
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Next Up</h2>
                        <Link to="/matches" className="text-cyan-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors">Full Fixtures →</Link>
                    </div>
                    <div className="space-y-6">
                        {upcomingMatches.map(m => {
                            const teamA = data.teams.find(t => t.id === m.teamA);
                            const teamB = data.teams.find(t => t.id === m.teamB);
                            return (
                                <div key={m.id} className="bg-slate-900 p-8 rounded-[32px] border border-white/5 hover:border-cyan-500/30 transition-all flex justify-between items-center group shadow-xl">
                                    <div className="flex flex-col items-center flex-1 space-y-3">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shadow-2xl shrink-0">
                                            {teamA?.logoUrl ? <img src={teamA.logoUrl} className="w-full h-full object-contain" alt="" /> : <span className="text-2xl">🛡️</span>}
                                        </div>
                                        <div className="font-black uppercase tracking-tighter text-white text-xs md:text-sm text-center italic">{teamA?.name}</div>
                                    </div>

                                    <div className="mx-8 flex flex-col items-center">
                                        <div className="text-cyan-500 font-black text-2xl italic tracking-[0.3em]">VS</div>
                                        <div className="text-center mt-1.5 flex flex-col items-center">
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                                                {new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            </div>
                                            <div className="text-[10px] font-black text-cyan-500/80 uppercase tracking-[0.2em] mt-1.5 leading-none">
                                                {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center flex-1 space-y-3">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shadow-2xl shrink-0">
                                            {teamB?.logoUrl ? <img src={teamB.logoUrl} className="w-full h-full object-contain" alt="" /> : <span className="text-2xl">🛡️</span>}
                                        </div>
                                        <div className="font-black uppercase tracking-tighter text-white text-xs md:text-sm text-center italic">{teamB?.name}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Stats Highlights */}
            <section className="bg-slate-900 rounded-[50px] p-12 md:p-16 border border-white/10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px]"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 relative z-10">
                    <div className="text-center space-y-3">
                        <p className="text-6xl font-black text-white italic tracking-tighter">{data.teams.length}</p>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">CLUBS</p>
                    </div>
                    <div className="text-center space-y-3 border-x border-white/5">
                        <p className="text-6xl font-black text-white italic tracking-tighter">{data.players.length}</p>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">PLAYERS</p>
                    </div>
                    <div className="text-center space-y-3">
                        <p className="text-6xl font-black text-white italic tracking-tighter">{data.matches.length}</p>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">GAMES</p>
                    </div>
                    <div className="text-center space-y-3 border-l border-white/5">
                        <p className="text-6xl font-black text-white-400 italic tracking-tighter">{data.matches.filter(m => m.isCompleted).length}</p>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">RESULTS</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
