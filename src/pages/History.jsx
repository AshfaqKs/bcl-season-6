import { useState, useEffect } from "react";
import { getHistory, getTeams } from "../firebase/firestoreUtils";
import { Loading, ErrorMessage } from "../components/Status";

const History = () => {
    const [history, setHistory] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const [h, t] = await Promise.all([getHistory(), getTeams()]);
                setHistory(h.sort((a, b) => a.season - b.season));
                setTeams(t);
            } catch (err) {
                setError("Failed to load league history.");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <Loading />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="space-y-16 animate-fadeIn pb-20">
            <div className="text-center space-y-4">
                <p className="text-blue-500 font-black uppercase tracking-[0.4em] text-xs">The BCL Legacy</p>
                <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-tight">HALL OF FAME</h1>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
                {history.map((s) => {
                    const champ = teams.find(t => t.id === s.championTeamId);
                    return (
                        <div key={s.season} className="relative group overflow-hidden rounded-[50px] border border-white/10 bg-slate-900/50 hover:border-blue-500/50 transition-all duration-700 shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="p-10 flex flex-col items-center space-y-8 relative z-10">
                                {/* Season Badge */}
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Season</p>
                                    <p className="text-5xl font-black text-white italic leading-none">{s.season}</p>
                                </div>

                                {/* Champion Section */}
                                <div className="w-full flex flex-col items-center space-y-6">
                                    <div className="w-40 h-40 bg-white rounded-[40px] flex items-center justify-center p-8 shadow-2xl relative border-4 border-yellow-500/20 group-hover:border-yellow-500/50 transition-all duration-500">
                                        {champ?.logoUrl ? <img src={champ.logoUrl} className="w-full h-full object-contain" alt="" /> : <span className="text-6xl">🏆</span>}
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em]">Champion</p>
                                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">{champ?.name || "TBD"}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {history.length === 0 && (
                    <div className="md:col-span-2 text-center py-20 bg-slate-900/50 rounded-[50px] border border-dashed border-white/10">
                        <p className="text-gray-500 font-black uppercase tracking-widest italic">The legacy is being written...</p>
                    </div>
                )}
            </div>

            {/* Quote/Philosophy */}
            {/* <div className="max-w-3xl mx-auto text-center space-y-6 pt-10">
                <div className="w-20 h-1 bg-blue-600 mx-auto rounded-full"></div>
                <p className="text-xl md:text-3xl font-black text-white italic tracking-tighter uppercase leading-tight opacity-50">
                    "Champions are not made in gyms. Champions are made from something they have deep inside them—a desire, a dream, a vision."
                </p>
            </div> */}
        </div>
    );
};

export default History;
