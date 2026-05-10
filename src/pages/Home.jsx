import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMatches, getTeams, getPlayers } from "../firebase/firestoreUtils";
import { Loading } from "../components/Status";

const Home = () => {
    const [data, setData] = useState({ matches: [], teams: [], players: [] });
    const [loading, setLoading] = useState(true);

    const [awards, setAwards] = useState(null);
    const [seasonNumber, setSeasonNumber] = useState("6");

    useEffect(() => {
        const fetchData = async () => {
            const { getAwards, getHistory } = await import("../firebase/firestoreUtils");
            const [m, t, p, a, h] = await Promise.all([getMatches(), getTeams(), getPlayers(), getAwards(), getHistory()]);
            setData({ matches: m, teams: t, players: p });
            setAwards(a);
            setSeasonNumber(h.length + 1);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <Loading />;

    const recentMatches = data.matches.filter(m => m.isCompleted).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
    const upcomingMatches = data.matches.filter(m => !m.isCompleted).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3);

    const grandFinal = data.matches.find(m => m.isPlayoff && m.playoffStage === "Grand Final" && m.isCompleted);
    const champion = grandFinal ? (grandFinal.scoreA > grandFinal.scoreB ? data.teams.find(t => t.id === grandFinal.teamA) : data.teams.find(t => t.id === grandFinal.teamB)) : null;

    // League Topper Logic
    const getLeagueTopper = () => {
        const stats = data.teams.map(t => {
            const teamMatches = data.matches.filter(m => !m.isPlayoff && m.isCompleted && (m.teamA === t.id || m.teamB === t.id));
            let pts = 0, gd = 0;
            teamMatches.forEach(m => {
                const isA = m.teamA === t.id;
                const gs = isA ? m.scoreA : m.scoreB;
                const gc = isA ? m.scoreB : m.scoreA;
                gd += (gs - gc);
                if (gs > gc) pts += 3;
                else if (gs === gc) pts += 1;
            });
            return { ...t, pts, gd };
        });
        return stats.sort((a, b) => b.pts - a.pts || b.gd - a.gd)[0];
    };
    const leagueTopper = getLeagueTopper();

    // Award Winners Logic
    const getTop = (stat) => [...data.players].sort((a, b) => b[stat] - a[stat])[0];
    const topScorer = getTop('goals');
    const topAssists = getTop('assists');
    const topCleansheets = getTop('cleanSheets');
    const pots = awards?.playerOfTheSeason ? data.players.find(p => p.id === awards.playerOfTheSeason) : null;
    const emerging = awards?.emergingPlayer ? data.players.find(p => p.id === awards.emergingPlayer) : null;
    const defender = awards?.bestDefender ? data.players.find(p => p.id === awards.bestDefender) : null;
    const gg = awards?.goldenGlove ? data.players.find(p => p.id === awards.goldenGlove) : topCleansheets;

    const AwardCard = ({ title, subtitle, player, icon, color }) => (
        <div className="bg-slate-900 border border-white/5 p-8 rounded-[40px] flex flex-col items-center text-center space-y-4 hover:border-blue-500/50 transition-all shadow-2xl relative overflow-hidden group">
            <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-${color}-500 to-transparent opacity-50`}></div>
            <div className="text-4xl group-hover:scale-125 transition-transform duration-500">{icon}</div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{title}</p>
                <p className={`text-xl font-black italic uppercase tracking-tighter text-${color}-400`}>{subtitle}</p>
            </div>
            {player ? (
                <div className="space-y-2">
                    <p className="text-white font-black uppercase italic tracking-tighter text-2xl">{player.name}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{data.teams.find(t => t.id === player.teamId)?.name}</p>
                </div>
            ) : (
                <p className="text-gray-600 font-black italic uppercase">TBA</p>
            )}
        </div>
    );

    return (
        <div className="space-y-24 animate-fadeIn pb-20">
            <div className="flex flex-col gap-12">
                {champion && (
                    <section className="relative p-12 md:p-16 rounded-[60px] overflow-hidden bg-gradient-to-br from-yellow-600 via-yellow-500 to-amber-700 shadow-[0_0_100px_rgba(234,179,8,0.3)] border-4 border-yellow-300/30 animate-winner w-full">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                            <p className="text-navy-dark font-black uppercase tracking-[0.5em] text-xs md:text-sm">Grand Champion</p>
                            <h2 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-2xl">THE WINNER</h2>
                            
                            <div className="w-48 h-48 md:w-64 md:h-64 bg-white rounded-[40px] flex items-center justify-center p-8 shadow-2xl relative border-8 border-yellow-400 group">
                                {champion.logoUrl ? <img src={champion.logoUrl} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" alt="" /> : <span className="text-8xl">🏆</span>}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-4xl md:text-6xl font-black text-navy-dark uppercase italic tracking-tighter">{champion.name}</h3>
                                <div className="inline-block bg-navy-dark text-yellow-400 px-10 py-3 rounded-full font-black uppercase tracking-widest text-xs md:text-sm shadow-xl">
                                    👑 King of BCL Season {seasonNumber}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {leagueTopper && (
                    <section className="relative p-12 md:p-16 rounded-[60px] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 shadow-[0_0_80px_rgba(59,130,246,0.2)] border-4 border-blue-500/30 w-full">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                            <p className="text-blue-400 font-black uppercase tracking-[0.5em] text-xs md:text-sm">Points Table Topper</p>
                            <h2 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-none">LEAGUE LEADERS</h2>
                            
                            <div className="w-48 h-48 md:w-64 md:h-64 bg-white rounded-[40px] flex items-center justify-center p-8 shadow-2xl relative border-8 border-blue-500 group">
                                {leagueTopper.logoUrl ? <img src={leagueTopper.logoUrl} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" alt="" /> : <span className="text-8xl">🛡️</span>}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter">{leagueTopper.name}</h3>
                                <div className="inline-block bg-blue-600 text-white px-10 py-3 rounded-full font-black uppercase tracking-widest text-xs md:text-sm shadow-xl">
                                    🛡️ League Shield Winners
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {champion && (
                <section className="space-y-12">
                    <div className="text-center space-y-4">
                        <p className="text-blue-500 font-black uppercase tracking-[0.4em] text-xs">The Best of Season {seasonNumber}</p>
                        <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">SEASON HONORS</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <AwardCard title="Golden Boot" subtitle="Top Scorer" player={topScorer} icon="⚽" color="yellow" />
                        <AwardCard title="Best Playmaker" subtitle="Top Assists" player={topAssists} icon="🪄" color="blue" />
                        <AwardCard title="Golden Glove" subtitle="Best Keeper" player={gg} icon="🧤" color="emerald" />
                        <AwardCard title="Season MVP" subtitle="Player of the Season" player={pots} icon="🏆" color="purple" />
                        <AwardCard title="Rising Star" subtitle="Emerging Player" player={emerging} icon="✨" color="cyan" />
                        <AwardCard title="Iron Wall" subtitle="Best Defender" player={defender} icon="🛡️" color="slate" />
                        <AwardCard title="Wall of Fame" subtitle="Most Clean Sheets" player={topCleansheets} icon="🛡️" color="orange" />
                    </div>
                </section>
            )}

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
                            BCL <span className="text-blue-500 italic">SEASON {seasonNumber}</span>
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
