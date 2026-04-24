import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPlayers, getTeams } from "../firebase/firestoreUtils";
import { Loading, ErrorMessage } from "../components/Status";
import PosterLayout from "../components/PosterLayout";
import DownloadButton from "../components/DownloadButton";

const PlayerProfile = () => {
    const { id } = useParams();
    const [player, setPlayer] = useState(null);
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [players, teams] = await Promise.all([getPlayers(), getTeams()]);
                const p = players.find(x => x.id === id);
                if (p) {
                    setPlayer(p);
                    setTeam(teams.find(t => t.id === p.teamId));
                } else {
                    setError("Player not found.");
                }
            } catch (err) {
                setError("Failed to load player profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <Loading />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="space-y-12 animate-fadeIn pb-20 px-4 md:px-0">
            {/* Navigation Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 border-b border-white/10 pb-8">
                <Link to="/players" className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2">
                    <span className="text-xl">←</span>
                    <span className="text-xs font-black uppercase tracking-widest">Back to Squads</span>
                </Link>
                <DownloadButton 
                    elementId="player-card" 
                    filename={`bcl-${player.name.replace(/\s+/g, '-')}`} 
                    label="Download Signature Card"
                />
            </div>

            {/* SIGNATURE CARD POSTER - RESPONSIVE CONTAINER */}
            <div className="flex justify-center items-center py-4 overflow-hidden w-full">
                <div className="relative transform scale-[0.3] sm:scale-[0.5] md:scale-[0.7] lg:scale-100 origin-center my-[-300px] sm:my-[-200px] md:my-[-100px] lg:my-0">
                    <PosterLayout id="player-card">
                        <div className="flex flex-col h-full p-2 relative">
                            <div className="flex justify-between items-start mb-16">
                                <div className="space-y-4">
                                    <h1 className="text-7xl font-black italic text-white uppercase tracking-tighter leading-[1.1] pr-6">{player.name}</h1>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1.5 shadow-xl">
                                            {team?.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-contain" alt="" /> : "🛡️"}
                                        </div>
                                        <p className="text-2xl font-black text-blue-400 uppercase tracking-[0.2em] italic leading-none">{team?.name}</p>
                                    </div>
                                </div>
                                <div className="bg-blue-600 text-white px-6 py-2 rounded-2xl font-black text-xl italic shadow-2xl tracking-tighter leading-none mt-2">
                                    BCL SEASON 6
                                </div>
                            </div>

                            <div className="flex-grow flex gap-12 items-center">
                                <div className="w-[480px] aspect-[4/5] bg-slate-800 rounded-[40px] overflow-hidden border-[10px] border-white/10 shadow-2xl relative shrink-0">
                                    {player.photoUrl ? (
                                        <img 
                                            src={player.photoUrl} 
                                            className="w-full h-full object-cover" 
                                            style={{ 
                                                imageRendering: 'auto',
                                                WebkitBackfaceVisibility: 'hidden',
                                                backfaceVisibility: 'hidden'
                                            }}
                                            alt={player.name} 
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">👤</div>
                                    )}
                                    <div className="absolute top-8 left-8 bg-blue-600 text-white px-6 py-2 rounded-2xl font-black text-lg tracking-[0.2em] shadow-2xl border border-white/20 leading-none">
                                        {player.position}
                                    </div>
                                </div>

                                <div className="flex-grow flex flex-col justify-center space-y-8">
                                    <div className="bg-white/5 p-10 rounded-3xl border border-white/10 shadow-xl text-center">
                                        <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4 leading-none">Player Age</p>
                                        <p className="text-7xl font-black italic text-white leading-none">{player.age || "??"}</p>
                                    </div>
                                    
                                    <div className="bg-slate-900 p-12 rounded-[50px] shadow-2xl border-4 border-blue-600/50 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                        <p className="text-xs font-black text-blue-400 uppercase tracking-[0.4em] mb-10 opacity-60 leading-none">SEASON STATISTICS</p>
                                        <div className="grid grid-cols-3 gap-6 text-white">
                                            <div className="text-center">
                                                <p className="text-7xl font-black italic leading-none">{player.goals}</p>
                                                <p className="text-[12px] font-black uppercase tracking-widest mt-4 text-gray-400 leading-none">Goals</p>
                                            </div>
                                            <div className="text-center border-x border-white/10">
                                                <p className="text-7xl font-black italic leading-none">{player.assists}</p>
                                                <p className="text-[12px] font-black uppercase tracking-widest mt-4 text-gray-400 leading-none">Assists</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-7xl font-black italic leading-none">{player.matches || 0}</p>
                                                <p className="text-[12px] font-black uppercase tracking-widest mt-4 text-gray-400 leading-none">Apps</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </PosterLayout>
                </div>
            </div>
        </div>
    );
};

export default PlayerProfile;
