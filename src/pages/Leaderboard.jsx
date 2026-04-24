import { useState, useEffect } from "react";
import { getTeams, getMatches } from "../firebase/firestoreUtils";
import { Loading, ErrorMessage } from "../components/Status";
import PosterLayout from "../components/PosterLayout";
import PosterHeader from "../components/PosterHeader";
import DownloadButton from "../components/DownloadButton";

const Leaderboard = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [posterMode, setPosterMode] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [teams, matches] = await Promise.all([getTeams(), getMatches()]);
                const completedMatches = matches.filter(m => m.isCompleted);
                
                const teamStats = teams.map(team => {
                    let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0;
                    completedMatches.forEach(m => {
                        if (m.teamA === team.id) {
                            played++; gf += m.scoreA; ga += m.scoreB;
                            if (m.scoreA > m.scoreB) won++;
                            else if (m.scoreA === m.scoreB) drawn++;
                            else lost++;
                        } else if (m.teamB === team.id) {
                            played++; gf += m.scoreB; ga += m.scoreA;
                            if (m.scoreB > m.scoreA) won++;
                            else if (m.scoreB === m.scoreA) drawn++;
                            else lost++;
                        }
                    });
                    return { id: team.id, name: team.name, logoUrl: team.logoUrl, played, won, drawn, lost, gf, ga, gd: gf - ga, pts: (won * 3) + drawn };
                });
                setStats(teamStats.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf));
            } catch (err) {
                setError("Failed to load leaderboard.");
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
        return idx + 1;
    };

    return (
        <div className="space-y-12 animate-fadeIn pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/10 pb-8">
                <div className="text-center md:text-left space-y-2">
                    <p className="text-blue-500 font-black uppercase tracking-[0.3em] text-xs">League Standings</p>
                    <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase">LEADERBOARD</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => setPosterMode(!posterMode)}
                        className={`px-6 py-3 rounded-xl font-black uppercase tracking-tighter transition-all shadow-xl ${posterMode ? 'bg-white text-slate-950 hover:bg-gray-100' : 'bg-slate-900 text-white border border-white/20'}`}
                    >
                        {posterMode ? "Switch to Website View" : "✨ Poster Mode"}
                    </button>
                    {posterMode && <DownloadButton elementId="standings-poster" filename="bcl-standings" />}
                </div>
            </div>

            {posterMode ? (
                <PosterLayout id="standings-poster">
                    <PosterHeader title="LEAGUE TABLE" subtitle="SEASON 6 STANDINGS" />
                    <div className="bg-white/5 backdrop-blur-md rounded-[40px] border border-white/10 overflow-hidden shadow-2xl flex-grow">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-blue-600 text-[10px] font-black text-white uppercase tracking-[0.3em]">
                                    <th className="px-6 py-8 text-center">Pos</th>
                                    <th className="px-6 py-8">Club</th>
                                    <th className="px-4 py-8 text-center">PL</th>
                                    <th className="px-4 py-8 text-center">W</th>
                                    <th className="px-4 py-8 text-center">D</th>
                                    <th className="px-4 py-8 text-center">L</th>
                                    <th className="px-4 py-8 text-center">GD</th>
                                    <th className="px-8 py-8 text-center bg-white/20">PTS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {stats.slice(0, 8).map((team, idx) => (
                                    <tr key={team.id} className={idx === 0 ? "bg-blue-600/10" : ""}>
                                        <td className="px-6 py-6 text-center font-black text-3xl italic text-gray-500">
                                            {getRankBadge(idx)}
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center space-x-6">
                                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 border border-white/10 shadow-2xl shrink-0">
                                                    {team.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-contain" alt="" /> : <span className="text-2xl">🛡️</span>}
                                                </div>
                                                <span className="font-black text-2xl uppercase tracking-tighter text-white truncate max-w-[250px] italic">{team.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-6 text-center font-bold text-2xl text-gray-400">{team.played}</td>
                                        <td className="px-4 py-6 text-center font-bold text-xl text-white">{team.won}</td>
                                        <td className="px-4 py-6 text-center font-bold text-xl text-gray-500">{team.drawn}</td>
                                        <td className="px-4 py-6 text-center font-bold text-xl text-gray-500">{team.lost}</td>
                                        <td className={`px-4 py-6 text-center font-black text-2xl ${team.gd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {team.gd > 0 ? `+${team.gd}` : team.gd}
                                        </td>
                                        <td className="px-8 py-6 text-center font-black text-4xl text-white bg-white/5 italic">
                                            {team.pts}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </PosterLayout>
            ) : (
                <div className="bg-slate-900 rounded-[40px] border border-white/5 overflow-hidden shadow-2xl animate-fadeIn">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-950 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                                    <th className="px-6 py-6 text-center">Pos</th>
                                    <th className="px-6 py-6">Club</th>
                                    <th className="px-4 py-6 text-center">Pl</th>
                                    <th className="px-4 py-6 text-center">W</th>
                                    <th className="px-4 py-6 text-center">D</th>
                                    <th className="px-4 py-6 text-center">L</th>
                                    <th className="px-4 py-6 text-center font-black text-white">GD</th>
                                    <th className="px-6 py-6 text-center bg-blue-600/10 font-black text-blue-400 border-l border-white/5">Pts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {stats.map((team, idx) => (
                                    <tr key={team.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-5 text-center font-black text-xl italic text-gray-400 group-hover:text-blue-500 transition-colors">
                                            {getRankBadge(idx)}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 border border-white/10 shadow-inner shrink-0">
                                                    {team.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-contain" alt="" /> : <span className="text-xl">🛡️</span>}
                                                </div>
                                                <span className="font-black text-lg md:text-xl uppercase tracking-tighter truncate max-w-[150px] md:max-w-none text-white italic">{team.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5 text-center font-bold text-gray-400">{team.played}</td>
                                        <td className="px-4 py-5 text-center font-bold text-white">{team.won}</td>
                                        <td className="px-4 py-5 text-center font-bold text-gray-500">{team.drawn}</td>
                                        <td className="px-4 py-5 text-center font-bold text-gray-500">{team.lost}</td>
                                        <td className={`px-4 py-5 text-center font-black ${team.gd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {team.gd > 0 ? `+${team.gd}` : team.gd}
                                        </td>
                                        <td className="px-6 py-5 text-center font-black text-3xl bg-blue-600/5 border-l border-white/5 text-white group-hover:bg-blue-600/20 transition-colors italic">
                                            {team.pts}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
