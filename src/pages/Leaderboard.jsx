import { useState, useEffect } from "react";
import { getTeams, getPlayers, getMatches } from "../firebase/firestoreUtils";
import { Loading, ErrorMessage } from "../components/Status";
import PosterLayout from "../components/PosterLayout";
import PosterHeader from "../components/PosterHeader";
import DownloadButton from "../components/DownloadButton";

const Leaderboard = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [posterMode, setPosterMode] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tData, pData, mData] = await Promise.all([getTeams(), getPlayers(), getMatches()]);
                
                const stats = tData.map(team => {
                    const teamMatches = mData.filter(m => m.isCompleted && (m.teamA === team.id || m.teamB === team.id));
                    let played = teamMatches.length;
                    let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;

                    teamMatches.forEach(m => {
                        const isTeamA = m.teamA === team.id;
                        const scoreMe = isTeamA ? m.scoreA : m.scoreB;
                        const scoreThem = isTeamA ? m.scoreB : m.scoreA;

                        gf += scoreMe;
                        ga += scoreThem;

                        if (scoreMe > scoreThem) wins++;
                        else if (scoreMe === scoreThem) draws++;
                        else losses++;
                    });

                    return {
                        ...team,
                        played, wins, draws, losses, gf, ga,
                        gd: gf - ga,
                        pts: (wins * 3) + draws
                    };
                });

                setTeams(stats.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf));
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

    return (
        <div className="space-y-12 animate-fadeIn pb-20 px-4 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/10 pb-8">
                <div className="text-center md:text-left space-y-2">
                    <p className="text-blue-500 font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">League Standings</p>
                    <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">LEADERBOARD</h1>
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
                    {posterMode && <DownloadButton elementId="table-poster" filename="bcl-standings" />}
                    */}
                </div>
            </div>

            {posterMode ? (
                <div className="flex justify-center items-center py-4 overflow-hidden w-full">
                    <div className="relative transform scale-[0.3] sm:scale-[0.5] md:scale-[0.7] lg:scale-100 origin-center my-[-300px] sm:my-[-200px] md:my-[-100px] lg:my-0">
                        <PosterLayout id="table-poster">
                            <PosterHeader title="LEAGUE TABLE" subtitle="SEASON 6 STANDINGS" color="blue" />
                            <div className="flex-grow flex flex-col w-full px-10">
                                <div className="bg-blue-600 rounded-t-3xl p-6 flex items-center font-black text-white italic tracking-tighter text-xl uppercase">
                                    <div className="w-16">Pos</div>
                                    <div className="flex-grow">Club</div>
                                    <div className="flex items-center space-x-12 text-center w-80">
                                        <div className="w-12">PL</div>
                                        <div className="w-12">W</div>
                                        <div className="w-12">D</div>
                                        <div className="w-12">L</div>
                                        <div className="w-12">GD</div>
                                    </div>
                                    <div className="w-24 text-right">Pts</div>
                                </div>
                                <div className="flex-grow bg-white/10 rounded-b-3xl border border-white/10 overflow-hidden">
                                    {teams.slice(0, 5).map((team, idx) => (
                                        <div key={team.id} className={`flex items-center p-6 border-b border-white/5 font-black italic tracking-tighter text-3xl uppercase ${idx % 2 === 0 ? 'bg-white/5' : ''}`}>
                                            <div className="w-16 text-gray-500">
                                                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                                            </div>
                                            <div className="flex-grow flex items-center space-x-6">
                                                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-2 shadow-xl shrink-0">
                                                    {team.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-contain" alt="" /> : "🛡️"}
                                                </div>
                                                <span className="text-white truncate max-w-[400px]">{team.name}</span>
                                            </div>
                                            <div className="flex items-center space-x-12 text-center w-80 text-gray-400">
                                                <div className="w-12">{team.played}</div>
                                                <div className="w-12">{team.wins}</div>
                                                <div className="w-12">{team.draws}</div>
                                                <div className="w-12">{team.losses}</div>
                                                <div className={`w-12 ${team.gd > 0 ? 'text-green-400' : team.gd < 0 ? 'text-red-400' : ''}`}>
                                                    {team.gd > 0 ? `+${team.gd}` : team.gd}
                                                </div>
                                            </div>
                                            <div className="w-24 text-right text-white text-5xl">{team.pts}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </PosterLayout>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-900/50 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-blue-600 text-white font-black italic uppercase tracking-tighter text-sm md:text-base">
                                <tr>
                                    <th className="px-4 md:px-8 py-6">Pos</th>
                                    <th className="px-4 md:px-8 py-6">Team</th>
                                    <th className="px-4 py-6 text-center">PL</th>
                                    <th className="px-4 py-6 text-center">W</th>
                                    <th className="px-4 py-6 text-center">D</th>
                                    <th className="px-4 py-6 text-center">L</th>
                                    <th className="px-4 py-6 text-center hidden md:table-cell">GF</th>
                                    <th className="px-4 py-6 text-center hidden md:table-cell">GA</th>
                                    <th className="px-4 py-6 text-center">GD</th>
                                    <th className="px-4 md:px-8 py-6 text-center bg-blue-700">PTS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {teams.map((team, idx) => (
                                    <tr key={team.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="px-4 md:px-8 py-6">
                                            <span className="text-xl md:text-2xl font-black italic text-gray-500">
                                                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-8 py-6">
                                            <div className="flex items-center space-x-4 md:space-x-6">
                                                <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-xl flex items-center justify-center p-2 shadow-xl shrink-0">
                                                    {team.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-contain" alt="" /> : "🛡️"}
                                                </div>
                                                <span className="text-white font-black italic uppercase tracking-tighter text-sm md:text-xl truncate max-w-[120px] md:max-w-none">{team.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-6 text-center font-bold text-gray-400">{team.played}</td>
                                        <td className="px-4 py-6 text-center font-bold text-gray-400">{team.wins}</td>
                                        <td className="px-4 py-6 text-center font-bold text-gray-400">{team.draws}</td>
                                        <td className="px-4 py-6 text-center font-bold text-gray-400">{team.losses}</td>
                                        <td className="px-4 py-6 text-center font-bold text-gray-500 hidden md:table-cell">{team.gf}</td>
                                        <td className="px-4 py-6 text-center font-bold text-gray-500 hidden md:table-cell">{team.ga}</td>
                                        <td className={`px-4 py-6 text-center font-black italic ${team.gd > 0 ? 'text-green-400' : team.gd < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                            {team.gd > 0 ? `+${team.gd}` : team.gd}
                                        </td>
                                        <td className="px-4 md:px-8 py-6 text-center text-xl md:text-3xl font-black italic text-white bg-blue-600/20">
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
